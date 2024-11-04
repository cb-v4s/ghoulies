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
		// ! Allow all origins for simplicity
		// TODO: allow only "origin"
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
				clients[clientID].RoomId = reqData.RoomName
			}

			broadcastRoom(eventName, resData, reqData.RoomName)

		// ! 2.
		/* Este evento se encarga de actualizar datos de un usuario (posicion, nombre o direccion)
		de un usuario en una sala para todos los usuarios en ella */
		case "updateUserPosition":
			var reqData types.UpdatePlayerPosition
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

		case "updateUserDirection":
			// TODO:
		case "directMessage":
			var reqData types.DirectMsg
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			sendDirect("directMsg", reqData.UserId, map[string]interface{}{
				"From": clientID,
				"Msg":  reqData.Msg,
			})
		case "roomBroadcast":
			var reqData types.Msg
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				return
			}

			// * Obten el id de la sala de clients
			roomId := clients[clientID].RoomId
			fmt.Printf("roomId: %s\n", roomId)

			// sendBroadcastMessage()
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

	for _, user := range room.RoomHdl.Rooms[roomId].Users {
		userConn := user.Connection

		sendPayload(userConn, payload)
	}
}

func sendDirect(eventName string, targetUid string, data map[string]interface{}) {
	userConn := clients[targetUid].Conn

	sendPayload(userConn, map[string]interface{}{
		"Event": eventName,
		"Data":  data,
	})
}

func sendPayload(userConn *websocket.Conn, payload map[string]interface{}) {
	err := userConn.WriteJSON(payload)
	if err != nil {
		log.Printf("Error sending payload to %v: %v", userConn.RemoteAddr(), err)
		userConn.Close()

		// TODO:
		// LeaveRoom()
	}
}
