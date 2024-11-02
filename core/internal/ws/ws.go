package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"sync"

	"core/config"
	"core/internal/lib"
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

type Client struct {
	ID   *net.Addr
	Conn *websocket.Conn
}

// Global variables for managing rooms and clients
var (
	clients   = make(map[net.Addr]*Client) // Connected clients
	clientsMu sync.Mutex                   // Mutex to protect access to clients
)

func NewRoomHandler() *room.RoomHandler {
	newRoom := &room.RoomHandler{
		Rooms: make(map[string]*room.RoomData), // Initialize the Rooms map
	}

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

	clientID := socket.RemoteAddr()

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
			addUser(socket, userData)
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

// handleUserCreation processes user creation events.
func addUser(socket *websocket.Conn, data AddUser) {
	// Check if the room is full (you'll need to implement this function)
	if RoomHandler.IsRoomFull(data.RoomName) {
		socket.WriteJSON(map[string]string{"event": "error_room_full"})
		return
	}

	userID := socket.RemoteAddr()

	// Check if the room already exists
	roomData, exists := RoomHandler.Rooms[data.RoomName]
	fmt.Println("exists =>", exists)
	fmt.Println("roomData =>", roomData)

	if !exists {
		fmt.Println("Room does not exist. Creating a new one...")
		roomData = &room.RoomData{
			Users:          []types.User{},
			UsersPositions: []string{},                         // Initialize as empty map for set behavior
			UserIdxMap:     make(map[room.UserID]room.UserIdx), // Initialize as empty map for user indices
		}

		RoomHandler.Rooms[data.RoomName] = roomData

		// Set initial position
		newPosition := lib.Position{Row: 0, Col: 0} // Initial position

		// Create new user
		newUser := types.User{
			UserName:    data.UserName,
			UserID:      userID,
			RoomID:      data.RoomName,
			Position:    newPosition,
			Avatar:      types.DefaultAvatars[data.AvatarId],
			AvatarXAxis: types.Right,
		}

		// Add user to the room
		roomData.Users = append(roomData.Users, newUser)
		roomData.UsersPositions = append(roomData.UsersPositions, room.PositionToString(newPosition))

		roomData.UserIdxMap[room.UserID(userID)] = room.UserIdx(len(roomData.Users) - 1)
	}

	log.Printf("Emitting user creation for user: %v\n", data)

	for roomId := range RoomHandler.Rooms {
		fmt.Printf("roomId: %v\n", roomId)
	}

	socket.WriteJSON(map[string]string{"test": "naananan"})

	// Create user
	// RoomHandler.CreateUser(socket.RemoteAddr().String(), roomName, userName, avatarID)

	// for sck := range RoomHandler.Rooms {
	// 	fmt.Printf(sck)
	// }

	// sendToRoom("initMap", map[string]int{"gridSize": room.GridSize}, roomName)
	// io.to(roomName).emit("userCreated", roomHdl.rooms.get(roomName).users);
}

func sendToRoom(event string, data interface{}, roomName string) {
	clientsMu.Lock()
	defer clientsMu.Unlock()

	// for _, client := range RoomHandler.Rooms {
	// 	fmt.Printf("client ------> %v", client)
	// 	client.Close()
	// }

	for client := range clients {
		fmt.Printf("Client => %v", client)
	}

	// for _, client := range RoomHandler.Rooms {
	// 	message := struct {
	// 		Event string      `json:"event"`
	// 		Data  interface{} `json:"data"`
	// 	}{
	// 		Event: event,
	// 		Data:  data,
	// 	}

	// 	err := client.WriteJSON(message)
	// 	if err != nil {
	// 		log.Printf("Error sending message to %v: %v", client.RemoteAddr(), err)
	// 		client.Close() // Close the connection if there's an error
	// 		// Remove client from room if necessary
	// 		removeClientFromRoom(client, roomName)
	// 	}
	// }
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
