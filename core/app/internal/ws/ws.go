package ws

import (
	"core/config"
	"core/internal/lib"
	"core/internal/memory"
	"core/internal/server/services"
	"core/types"
	"core/util"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Upgrader is used to upgrade an HTTP connection to a WebSocket connection.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("origin")

		if config.GinMode == gin.DebugMode {
			if origin == "" {
				return true
			}
		}

		allowedOrigins := strings.Split(config.AllowOrigins, ",")
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}

		return false
	},
}

var (
	activeIPAddresses   = make(map[net.Addr]int)
	activeIPAddressesMu sync.Mutex
)

// HandleWebSocket handles incoming WebSocket connections.
func HandleWebSocket(c *gin.Context) {
	userConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error while upgrading connection: %v", err)
		return
	}

	ipAddr := userConn.RemoteAddr()

	activeIPAddressesMu.Lock()

	connectionsLimit, err := strconv.Atoi(config.WsConnectionsLimit)
	if err != nil {
		log.Printf("Error parsing WSCONN_LIMIT: %v. Defaulting to 1.", err)
		connectionsLimit = 1
	}

	if activeIPAddresses[ipAddr] >= connectionsLimit {
		fmt.Printf("Connection limit reached for IP: %s", ipAddr)
		activeIPAddressesMu.Unlock()
		userConn.WriteMessage(websocket.CloseMessage, []byte{})
		return
	}

	activeIPAddresses[ipAddr]++
	activeIPAddressesMu.Unlock()

	id, err := util.GetRandomId()
	userId := types.UserID(id)

	if err != nil {
		fmt.Printf("Error getting random id: %v", err)
	}

	// Create a new client
	client := &types.Client{
		ID:     userId,
		Conn:   userConn,
		RoomId: "",
	}

	// * Register the new client to Redis
	memory.AddClient(client)
	log.Println("A user connected:", userConn.RemoteAddr())

	defer func() {
		// userConn.Close() // ya se hace en LeaveRoom
		LeaveRoom(userId)
		memory.DeleteClient(userId)

		activeIPAddressesMu.Lock()
		activeIPAddresses[ipAddr]--
		activeIPAddressesMu.Unlock()

	}()

	// Main loop to listen for messages
	for {
		var payload types.WsPayload

		err := userConn.ReadJSON(&payload)
		if err != nil {
			log.Printf("Error reading JSON: %v", err)
			break
		}

		switch payload.Event {
		// ! 1.
		/* Este evento se encarga de crear una sala (si no existe) e integrar un usuario a una sala,
		y va a emitir un evento con el tamaño de la sala y datos de los usuarios en ella */
		case "newRoom":
			var reqData types.NewRoom
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
				return
			}

			fmt.Println("payload.Event =>", reqData)

			resData, err := services.NewRoom(userConn, types.UserID(userId), reqData)
			if err != nil {
				// TODO: sendDirect the error
				fmt.Printf("something went wrong: %v\n", err)
				return
			}

			fmt.Printf("resData: %v\n", resData)

			if err := memory.UpdateUserRoom(userId, resData.RoomId); err != nil {
				fmt.Printf("failed to update client room: %v", err)
				return
			}

			fmt.Printf("Client room update to roomId: ")

			// if err := broadcastRoom(eventName, resData, reqData.RoomName); err != nil {
			// 	fmt.Printf("failed to broadcast to room: %s", reqData.RoomName)
			// 	return
			// }

		case "joinRoom":
			return

		// ! 2.
		/* Este evento se encarga de actualizar datos de un usuario (posicion, nombre o direccion)
		de un usuario en una sala para todos los usuarios en ella */
		case "updateUserPos":
			var reqData types.UpdateUserPos
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			fmt.Println("payload.Event =>", reqData)

			var row, col int
			fmt.Sscanf(reqData.Dest, "%d,%d", &row, &col)

			roomData, exists := memory.GetRoom(reqData.RoomId)

			if !exists {
				fmt.Printf("room not found")
				return
			}

			userIdx := services.GetUserIdx(types.UserID(userId), reqData.RoomId)
			if userIdx == -1 {
				fmt.Printf("user not found")
				return
			}

			currentPos := roomData.Users[userIdx].Position
			posKey := fmt.Sprintf("%d,%d", currentPos.Row, currentPos.Col)

			invalidPositions := roomData.UsersPositions

			// Find path to the destination (implement findPath)
			path := lib.FindPath(currentPos.Row, currentPos.Col, row, col, services.GridSize, invalidPositions)
			if len(path) == 0 {
				fmt.Printf("no valid path")
				return
			}

			// TODO:
			// ! move to background (a go routine) ?
			for _, newPosition := range path {
				fmt.Printf("newPosition: %v\n", newPosition)

				roomData.Users[userIdx].Position = newPosition
				newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)
				roomData.UsersPositions = append(roomData.UsersPositions, newPosKey)
				util.Delete(roomData.UsersPositions, posKey)

				data := map[string]interface{}{
					"users": roomData.Users,
				}

				broadcastRoom("updateMap", data, reqData.RoomId)
				time.Sleep(time.Duration(services.SpeedUserMov) * time.Millisecond) // Simulate movement delay
			}

		// TODO: check if working
		case "updateUserFacingDir":
			var reqData types.UpdateUserFacingDir
			err := parsePayload(payload, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			client, err := memory.GetClient(types.UserID(userId))
			if err != nil {
				fmt.Printf("client does not exist")
				return
			}

			roomData, exists := memory.GetRoom(client.RoomId)
			if !exists {
				fmt.Printf("room not found")
				return
			}

			userIdx, exists := roomData.UserIdxMap[types.UserID(userId)]
			if !exists {
				fmt.Printf("user not found")
				return
			}

			var row, col int
			fmt.Sscanf(reqData.Dest, "%d,%d", &row, &col)

			destPos := lib.Position{Row: row, Col: col}
			currPos := roomData.Users[userIdx].Position
			roomData.Users[userIdx].AvatarXAxis = services.GetUserFacingDir(currPos, destPos)

			data := map[string]interface{}{
				"users": roomData.Users,
			}

			broadcastRoom("updateMap", data, client.RoomId)
		case "directMessage":
			var reqData types.DirectMsg
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			filter := lib.TextFilter()
			var filteredText string = filter.CleanText(reqData.Msg)
			fmt.Printf("filteredText: %s", filteredText)

			sendDirect("directMsg", reqData.UserId, map[string]interface{}{
				"From": userId,
				"Msg":  filteredText,
			})
		case "roomBroadcast":
			var reqData types.Msg
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			filter := lib.TextFilter()
			var filteredText string = filter.CleanText(reqData.Msg)
			fmt.Printf("filteredText: %s", filteredText)

			client, err := memory.GetClient(userId)
			if err != nil {
				fmt.Printf("client does not exist")
				return
			}

			broadcastRoom("broadcastRoom", map[string]interface{}{
				"Msg": filteredText,
			}, client.RoomId)
		case "disconnect":
			// TODO:
		default:
			log.Println("Unknown event:", payload.Event)
		}
	}
}

func parsePayload(data interface{}, dest interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed marshaling data: %w", err)
	}

	err = json.Unmarshal(jsonData, dest)
	if err != nil {
		return fmt.Errorf("failed unmarshaling data: %w", err)
	}

	return nil
}

func broadcastRoom(eventName string, data map[string]interface{}, roomId types.RoomId) error {
	payload := make(map[string]interface{})
	payload["Event"] = eventName
	payload["Data"] = data

	room, exists := memory.GetRoom(roomId)
	if !exists {
		return fmt.Errorf("room does not exist")
	}

	for _, user := range room.Users {
		userConn := user.Connection

		if err := sendPayload(userConn, payload); err != nil {
			return fmt.Errorf("failed to send payload to %v. %v", userConn.RemoteAddr(), err)
		}
	}

	return nil
}

func sendDirect(eventName string, userId types.UserID, data map[string]interface{}) error {
	user, err := memory.GetClient(userId)
	if err != nil {
		return fmt.Errorf("client is not connected")
	}

	if err := sendPayload(user.Conn, map[string]interface{}{
		"Event": eventName,
		"Data":  data,
	}); err != nil {
		return fmt.Errorf("failed to send payload to %v. %v", user.Conn.RemoteAddr(), err)
	}

	return nil
}

func sendPayload(userConn *websocket.Conn, payload map[string]interface{}) error {
	if err := userConn.WriteJSON(payload); err != nil {
		userConn.Close()
		return fmt.Errorf("error: %v", err)
	}

	return nil
}

func LeaveRoom(userId types.UserID) error {
	userData, err := memory.GetClient(userId)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	services.RemoveUser(types.UserID(userId), userData.RoomId)
	userData.Conn.Close()
	return nil
}
