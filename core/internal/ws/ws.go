package ws

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"core/config"
	"core/internal/ws/room"
	"core/types"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var RoomHandler *room.RoomHandler

// Upgrader is used to upgrade an HTTP connection to a WebSocket connection.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity
	},
}

// Global variables for managing rooms and clients
var (
	clients   = make(map[*websocket.Conn]bool) // Connected clients
	clientsMu sync.Mutex                       // Mutex to protect access to clients
)

func NewRoomHandler() *room.RoomHandler {
	newRoom := &room.RoomHandler{
		Rooms: make(map[string]*room.RoomData), // Initialize the Rooms map
	}

	newRoom.Rooms[config.DefaultRoom] = &room.RoomData{
		Users:          []types.User{},
		UsersPositions: make(map[string]struct{}), // Initialize as empty map for set behavior
		UserIdxMap:     make(map[string]int),      // Initialize as empty map for user indices
	}

	return newRoom
}

// HandleWebSocket handles incoming WebSocket connections.
func HandleWebSocket(c *gin.Context) {
	socket, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error while upgrading connection: %v", err)
		return
	}
	defer socket.Close()

	// Register the new client
	clientsMu.Lock()
	clients[socket] = true
	clientsMu.Unlock()

	log.Println("A user connected:", socket.RemoteAddr())

	// Main loop to listen for messages
	defer func() {
		clientsMu.Lock()
		delete(clients, socket) // Unregister client on disconnect
		clientsMu.Unlock()
	}()

	for {
		var msg struct {
			Event string      `json:"event"`
			Data  interface{} `json:"data"`
		}

		err := socket.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading JSON: %v", err)
			break
		}

		switch msg.Event {
		case "userCreation":
			fmt.Println(socket, msg.Data)
			handleUserCreation(socket, msg.Data)
		case "updatePlayerDirection":
			// handleUpdatePlayerDirection(socket, msg.Data)
		case "updatePlayerPosition":
			// handleUpdatePlayerPosition(socket, msg.Data)
		case "message":
			// handleMessage(socket, msg.Data)
		case "disconnect":
			// handleDisconnect(socket)
		default:
			log.Println("Unknown event:", msg.Event)
		}
	}
}

// handleUserCreation processes user creation events.
func handleUserCreation(socket *websocket.Conn, data interface{}) {
	roomInfo := data.(map[string]interface{})
	roomName := roomInfo["roomName"].(string)

	// TODO: Uncomment
	// userName := roomInfo["userName"].(string)
	// avatarID := int(roomInfo["avatarId"].(float64))

	log.Println("Emitting user creation.")

	// Check if the room is full (you'll need to implement this function)
	if RoomHandler.IsRoomFull(roomName) {
		socket.WriteJSON(map[string]string{"event": "error_room_full"})
		return
	}

	// TODO: Uncomment
	// // Create the user (you'll need to implement this function)
	// RoomHandler.CreateUser(socket.RemoteAddr().String(), roomName, userName, avatarID)

	// // Join the user to the room (you'll need to implement this function)
	// RoomHandler.JoinRoom(roomName, socket)

	// // Emit initial map and user created event (you'll need to implement this)
	// RoomHandler.EmitInitMap(roomName)
	// RoomHandler.EmitUserCreated(roomName)
}

// // handleUpdatePlayerDirection processes player direction updates.
// func handleUpdatePlayerDirection(socket *websocket.Conn, data interface{}) {
// 	dest := data.(map[string]interface{}) // Assuming it has direction info
// 	roomId := getRoomID(socket)           // Implement to get room ID from socket

// 	if roomId == "" {
// 		log.Println("Error: invalid room at updatePlayerDirection")
// 		return
// 	}

// 	// Update player direction (implement your logic here)
// 	updatePlayerDirection(roomId, dest, socket.RemoteAddr().String())
// }

// // handleUpdatePlayerPosition processes player position updates.
// func handleUpdatePlayerPosition(socket *websocket.Conn, data interface{}) {
// 	dest := data.(map[string]interface{}) // Assuming this has position info
// 	roomId := getRoomID(socket)           // Implement to get room ID from socket

// 	if roomId == "" {
// 		log.Println("Error: invalid room at updatePlayerPosition")
// 		return
// 	}

// 	// Update player position (implement your logic here)
// 	updatePlayerPosition(roomId, dest, socket.RemoteAddr().String())
// }

// // handleMessage processes incoming chat messages.
// func handleMessage(socket *websocket.Conn, data interface{}) {
// 	msgData := data.(map[string]interface{})
// 	message := msgData["message"].(string)
// 	socketId := msgData["socketId"].(string)

// 	if socketId == "chatbotName" { // Replace with your chatbot identifier
// 		respondToChatbot(socket, message)
// 		return
// 	}

// 	// Broadcast the message to both users
// 	broadcastMessage(socket.RemoteAddr().String(), socketId, message)
// }

// // handleDisconnect processes user disconnect events.
// func handleDisconnect(socket *websocket.Conn) {
// 	log.Println("A user disconnected:", socket.RemoteAddr())

// 	roomId := getRoomID(socket) // Implement to get room ID from socket
// 	if roomId != "" {
// 		// Notify others in the room (implement your logic)
// 		emitUserDisconnected(socket.RemoteAddr().String(), roomId)
// 		removeUser(socket.RemoteAddr().String(), roomId) // Implement this function
// 	}
// }
