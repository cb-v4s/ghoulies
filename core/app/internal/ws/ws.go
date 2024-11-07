package ws

import (
	"core/config"
	"core/internal/lib"
	"core/internal/memory"
	"core/internal/room"
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

	clientID, err := util.RandomId()
	if err != nil {
		fmt.Printf("Error getting random id: %v", err)
	}

	// Create a new client
	client := &types.Client{
		ID:     clientID,
		Conn:   userConn,
		RoomId: "",
	}

	// * Register the new client to Redis
	memory.AddClient(client)
	log.Println("A user connected:", userConn.RemoteAddr())

	defer func() {
		userConn.Close()
		memory.DeleteClient(clientID)

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
		case "createUser":
			var reqData types.CreateUserData
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			fmt.Println("payload.Event =>", reqData)

			err, eventName, resData := room.CreateUser(userConn, types.UserID(clientID), reqData)
			if err != nil {
				fmt.Printf("Error: %v", err)
				return
			}

			memory.UpdateClientRoom(clientID, reqData.RoomName)
			broadcastRoom(eventName, resData, reqData.RoomName)

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

			userIdx := room.GetUserIdx(types.UserID(clientID), reqData.RoomId)
			if userIdx == -1 {
				fmt.Printf("user not found")
				return
			}

			currentPos := roomData.Users[userIdx].Position
			posKey := fmt.Sprintf("%d,%d", currentPos.Row, currentPos.Col)

			invalidPositions := roomData.UsersPositions

			// Find path to the destination (implement findPath)
			path := lib.FindPath(currentPos.Row, currentPos.Col, row, col, room.GridSize, invalidPositions)
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
				time.Sleep(time.Duration(room.SpeedUserMov) * time.Millisecond) // Simulate movement delay
			}

		// TODO: check if working
		case "updateUserFacingDir":
			var reqData types.UpdateUserFacingDir
			err := parsePayload(payload, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			client, err := memory.GetClient(clientID)
			if err != nil {
				fmt.Printf("client does not exist")
				return
			}

			roomData, exists := memory.GetRoom(client.RoomId)
			if !exists {
				fmt.Printf("room not found")
				return
			}

			userIdx, exists := roomData.UserIdxMap[types.UserID(clientID)]
			if !exists {
				fmt.Printf("user not found")
				return
			}

			var row, col int
			fmt.Sscanf(reqData.Dest, "%d,%d", &row, &col)

			destPos := lib.Position{Row: row, Col: col}
			currPos := roomData.Users[userIdx].Position
			roomData.Users[userIdx].AvatarXAxis = room.GetUserFacingDir(currPos, destPos)

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
				"From": clientID,
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

			client, err := memory.GetClient(clientID)
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

func broadcastRoom(eventName string, data map[string]interface{}, roomId string) {
	// ! TODO: use lock/unlock rooms

	payload := make(map[string]interface{})
	payload["Event"] = eventName
	payload["Data"] = data

	room, exists := memory.GetRoom(roomId)
	if !exists {
		fmt.Printf("room does not exist")
		return
	}

	for _, user := range room.Users {
		userConn := user.Connection

		sendPayload(userConn, payload)
	}
}

func sendDirect(eventName string, uid string, data map[string]interface{}) {
	user, err := memory.GetClient(uid)
	if err != nil {
		fmt.Printf("client is not connected")
		return
	}

	sendPayload(user.Conn, map[string]interface{}{
		"Event": eventName,
		"Data":  data,
	})
}

func sendPayload(userConn *websocket.Conn, payload map[string]interface{}) {
	err := userConn.WriteJSON(payload)
	if err != nil {
		log.Printf("Error sending payload to %v: %v", userConn.RemoteAddr(), err)
		userConn.Close()
	}
}

func LeaveRoom(uid string) error {
	user, err := memory.GetClient(uid)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	user.Conn.Close()

	return nil
}
