package ws

import (
	"core/config"
	"core/internal/adapters/memory"
	"core/internal/core"
	"core/internal/core/services"
	util "core/internal/utils"
	"core/types"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Upgrader is used to upgrade an HTTP connection to a WebSocket connection.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("origin")

		if config.GinMode == gin.DebugMode {
			return true
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
	activeConnections sync.Map
)

// HandleWebSocket handles incoming WebSocket connections.
func HandleWebSocket(c *gin.Context) {

	userConn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error while upgrading connection: %v", err)
		return
	}

	id, err := util.GetRandomId()
	userId := types.UserID(id)

	if err != nil {
		fmt.Printf("Error getting random id: %v", err)
	}

	// Create a new client
	client := &types.Client{
		ID:       userId,
		RoomId:   "",
		Username: "",
		Conn:     userConn,
	}

	messageClient := &types.MessageClient{
		Client: client,
		Send:   make(chan []byte),
		ConnMu: sync.Mutex{},
	}

	// ! goroutines
	go hdlClientMessages(messageClient)
	// TODO:
	// borrar salas vacias

	// * Register the new client to Redis
	activeConnections.Store(userId, client)
	memory.AddClient(client)
	log.Println("A user connected:", userConn.RemoteAddr())

	// ! this rans when main loop breaks
	defer func() {
		user, err := memory.GetClient(userId)
		if err != nil {
			return
		}

		// 1. Remove user from the room info
		services.RemoveUser(user.ID, user.RoomId)

		// 2. close the ws connection
		userConn.Close()

		// 3. delete the userId from activeConnections
		activeConnections.Delete(userId)

		// 4. delete the client from redis
		memory.DeleteClient(userId)

	}()

	// Main loop to listen for messages
	for {
		var payload types.WsPayload

		err := userConn.ReadJSON(&payload)
		if err != nil {
			fmt.Printf("Error reading JSON: %v", err)
			fmt.Printf("User is leaving: %v", userId)

			break
		}

		var username string
		authorization := payload.Authorization
		if authorization != "" {
			user, err := core.DecodeToken(authorization)
			fmt.Printf("user %v\n", user)

			if err != nil {
				fmt.Printf("unauthorized")
			}

			username = user.Username
		}

		switch payload.Event {
		case "newRoom":
			var reqData types.NewRoom
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			services.NewRoom(reqData, messageClient, userId)

		case "joinRoom":
			var reqData types.JoinRoom
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			if username != "" {
				reqData.UserName = username
			}

			services.JoinRoom(reqData, messageClient, userId)

		case "broadcastMessage":
			var reqData types.Msg
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
				continue
			}

			services.BroadcastMessage(reqData, messageClient, userId)

		// TODO: solo recibir jwtJoken, de ahi obtienes el userId y roomId
		case "updatePosition":
			var reqData types.UpdateUserPos
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				continue
			}

			services.UpdateUserPosition(reqData.RoomId, types.UserID(reqData.UserId), reqData.Dest)

		case "updateTyping":
			var reqData types.UpdateUserTyping
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				continue
			}

			services.UpdateUserTyping(types.RoomId(reqData.RoomId), types.UserID(reqData.UserId), reqData.IsTyping)

		case "leaveRoom":
			var reqData types.UserLeave
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				continue
			}

			services.LeaveRoom(reqData, userId, &activeConnections)

		default:
			log.Println("Unknown event received:", payload.Event)
		}
	}
}

func hdlClientMessages(mc *types.MessageClient) {
	for {
		select {
		case msg := <-mc.Send:
			mc.ConnMu.Lock()
			err := mc.Client.Conn.WriteMessage(websocket.TextMessage, msg)
			mc.ConnMu.Unlock()
			if err != nil {
				fmt.Printf("write error: %v\n", err)
				return
			}
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
