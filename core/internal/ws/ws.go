package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"core/config"
	"core/internal/lib"
	"core/internal/ws/room"
	"core/types"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var RoomHandler *room.RoomHandler

// Upgrader is used to upgrade an HTTP connection to a WebSocket connection.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity
	},
}

type Client struct {
	ID   *string
	Conn *websocket.Conn
}

// TODO: poner un lock aqui
type Room struct {
	Name    string
	Clients map[string]*Client
	mu      sync.Mutex
}

// Global variables for managing rooms and clients
var (
	clients   = make(map[string]*Client) // Connected clients
	clientsMu sync.Mutex                 // Mutex to protect access to clients
)

func NewRoomHandler() *room.RoomHandler {
	newRoom := &room.RoomHandler{
		Rooms: make(map[string]*room.RoomData), // Initialize the Rooms map
	}

	// Create a default room that will always exist
	newRoom.Rooms[config.DefaultRoom] = &room.RoomData{
		Users:          []types.User{},
		UsersPositions: []string{},                         // Initialize as empty map for set behavior
		UserIdxMap:     make(map[room.UserID]room.UserIdx), // Initialize as empty map for user indices
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

	clientID := uuid.Must(uuid.NewRandom()).String()

	// Create a new client
	client := &Client{
		ID:   &clientID,
		Conn: socket,
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
			var userData AddUser

			// JSON encode msg.Data
			jsonData, err := json.Marshal(msg.Data)
			if err != nil {
				log.Printf("Error marshaling data: %v", err)
				return
			}

			// convert dataBytes (JSON data) into the AddUser struct
			err = json.Unmarshal(jsonData, &userData)
			if err != nil {
				log.Printf("Error unmarshaling data: %v", err)
				continue
			}

			fmt.Println("msg.Event =>", userData)
			addUser(socket, clientID, userData)
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

// Broadcast function to send a message to all connected clients
// func broadcast(event string, data interface{}) {
// 	clientsMu.Lock()
// 	defer clientsMu.Unlock()

// 	for client := range clients {
// 		err := client.WriteJSON(struct {
// 			Event string      `json:"event"`
// 			Data  interface{} `json:"data"`
// 		}{
// 			Event: event,
// 			Data:  data,
// 		})
// 		if err != nil {
// 			log.Printf("Error sending message to %v: %v", client.RemoteAddr(), err)
// 			client.Close()          // Close the connection if there's an error
// 			delete(clients, client) // Remove the client from the list
// 		}
// 	}
// }

type AddUser struct {
	UserName string `json:"userName"`
	RoomName string `json:"roomName"`
	AvatarId int    `json:"avatarId"`
}

func (r *Room) Send(message interface{}) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, client := range r.Clients {
		if err := client.Conn.WriteJSON(message); err != nil {
			log.Printf("Error sending message to client %v: %v", client.ID, err)
		}
	}
}

// handleUserCreation processes user creation events.
func addUser(socket *websocket.Conn, userID string, data AddUser) {
	// TODO mover toda la logica de joinUser al modulo room

	// Check if the room is full
	if RoomHandler.IsRoomFull(data.RoomName) {
		socket.WriteJSON(map[string]string{"event": "error_room_full"})
		return
	}

	// Check if the room already exists
	roomData, exists := RoomHandler.Rooms[data.RoomName]

	// Set initial position
	newPosition := lib.Position{Row: 0, Col: 0} // Initial position

	// Create new user
	newUser := types.User{
		UserName:    data.UserName,
		UserID:      userID,
		Connection:  socket,
		RoomID:      data.RoomName,
		Position:    newPosition,
		Avatar:      types.DefaultAvatars[data.AvatarId],
		AvatarXAxis: types.Right,
	}

	if !exists {
		newRoomData := &room.RoomData{
			Users:          []types.User{},
			UsersPositions: []string{},                         // Initialize as empty map for set behavior
			UserIdxMap:     make(map[room.UserID]room.UserIdx), // Initialize as empty map for user indices
		}

		// Add user to the room
		newRoomData.Users = append(newRoomData.Users, newUser)
		newRoomData.UsersPositions = append(newRoomData.UsersPositions, room.PositionToString(newPosition))

		newRoomData.UserIdxMap[room.UserID(userID)] = 0

		RoomHandler.Rooms[data.RoomName] = newRoomData

	} else {
		newPositionStr, newPosition := RoomHandler.GetRandomEmptyPosition(roomData.UsersPositions)
		newUser.Position = newPosition

		// ? do i have to modify rooms like this or could i just modify roomData?
		RoomHandler.Rooms[data.RoomName].Users = append(roomData.Users, newUser)
		RoomHandler.Rooms[data.RoomName].UsersPositions = append(roomData.UsersPositions, newPositionStr)
		RoomHandler.Rooms[data.RoomName].UserIdxMap[room.UserID(userID)] = room.UserIdx(len(roomData.Users) - 1)
	}

	sendToRoom("initMap", map[string]interface{}{"gridSize": room.GridSize}, data.RoomName)
	sendToRoom("userCreated", map[string]interface{}{"users": RoomHandler.Rooms[data.RoomName].Users}, data.RoomName)
}

func sendToRoom(event string, data map[string]interface{}, roomName string) {
	// ! TODO: lock rooms here instead
	clientsMu.Lock()
	defer clientsMu.Unlock()

	message := make(map[string]interface{})
	message["Event"] = event
	message["Data"] = data

	for _, user := range RoomHandler.Rooms[roomName].Users {
		err := user.Connection.WriteJSON(message)

		// Close the connection if there's an error
		if err != nil {
			log.Printf("Error sending message to %v: %v", user.Connection.RemoteAddr(), err)
			user.Connection.Close()

			// TODO:
			// LeaveRoom()
		}
	}
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
