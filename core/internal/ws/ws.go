package ws

import (
	"core/internal/lib"
	"core/internal/room"
	"core/types"
	"core/util"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Upgrader is used to upgrade an HTTP connection to a WebSocket connection.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// ! allow all origins for simplicity
		return true
	},
}

// Global variables for managing rooms and clients
var (
	clients   = make(map[string]*types.Client) // Connected clients
	clientsMu sync.Mutex                       // Mutex to protect access to clients
)

// HandleWebSocket handles incoming WebSocket connections.
func HandleWebSocket(c *gin.Context) {
	socket, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error while upgrading connection: %v", err)
		return
	}
	defer socket.Close()

	clientID := uuid.Must(uuid.NewRandom()).String()

	// Create a new client
	client := &types.Client{
		ID:     &clientID,
		Conn:   socket,
		RoomId: "",
	}

	// Register the new client
	clientsMu.Lock()
	clients[clientID] = client
	clientsMu.Unlock()

	log.Println("A user connected:", socket.RemoteAddr())

	// Main loop to listen for messages
	defer func() {
		clientsMu.Lock()
		delete(clients, clientID) // Unregister client on disconnect
		clientsMu.Unlock()
	}()

	for {
		var payload types.WsPayload

		err := socket.ReadJSON(&payload)
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

			err, eventName, resData := room.CreateUser(socket, types.UserID(clientID), reqData)
			if err != nil {
				fmt.Printf("Error: %v", err)
				return
			}

			clients[clientID].RoomId = reqData.RoomName
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

			room.RoomHdl.Mu.Lock()
			roomData, exists := room.RoomHdl.Rooms[reqData.RoomName]
			room.RoomHdl.Mu.Unlock()

			if !exists {
				fmt.Printf("room not found")
				return
			}

			idx := room.GetUserIdx(room.RoomHdl, types.UserID(clientID), reqData.RoomName)
			if idx == -1 {
				fmt.Printf("user not found")
				return
			}

			currentPos := roomData.Users[idx].Position
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

				roomData.Users[idx].Position = newPosition
				newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)
				roomData.UsersPositions = append(roomData.UsersPositions, newPosKey)
				util.Delete(roomData.UsersPositions, posKey)

				data := map[string]interface{}{
					"users": roomData.Users,
				}

				broadcastRoom("updateMap", data, reqData.RoomName)
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

			client, exists := clients[clientID]
			if !exists {
				fmt.Printf("client does not exist")
				return
			}

			roomData, exists := room.RoomHdl.Rooms[client.RoomId]
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

			roomId := clients[clientID].RoomId

			broadcastRoom("broadcastRoom", map[string]interface{}{
				"Msg": filteredText,
			}, roomId)
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

	targetRoom, exists := room.RoomHdl.Rooms[roomId]
	if !exists {
		fmt.Printf("room does not exist")
		return
	}

	for _, user := range targetRoom.Users {
		userConn := user.Connection

		sendPayload(userConn, payload)
	}
}

func sendDirect(eventName string, uid string, data map[string]interface{}) {
	user, exists := clients[uid]
	if !exists {
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
	user, exists := clients[uid]
	if !exists {
		return fmt.Errorf("user not found")
	}

	user.Conn.Close()

	return nil
}
