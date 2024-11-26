package ws

import (
	"core/config"
	"core/internal/memory"
	"core/internal/server/services"
	"core/types"
	"core/util"
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

		switch payload.Event {
		case "newRoom":
			var reqData types.NewRoom
			err := util.ParsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			// ! remove a user from a room if connected
			user, _ := memory.GetClient(types.UserID(userId))
			if user != nil {
				services.RemoveUser(user.ID, user.RoomId)
			}

			resData, err := services.NewRoom(types.UserID(userId), reqData)
			if err != nil {
				fmt.Printf("something went wrong: %v\n", err)
			}

			data := map[string]string{"roomId": string(resData.RoomId), "userName": reqData.UserName}
			if err := memory.UpdateUser(userId, data); err != nil {
				fmt.Printf("failed to update client room: %v", err)
			}

			// ! Subscribe to the Redis channel for RoomId
			go memory.UserSubscribe(messageClient, resData.RoomId)

			updateSceneData := types.UpdateScene{
				RoomId: string(resData.RoomId),
				Users:  resData.Users,
			}

			memory.BroadcastRoom(resData.RoomId, "updateScene", updateSceneData)

			type SetUser struct {
				UserId string `json:"userId"`
			}

			setUserData := SetUser{
				UserId: string(userId),
			}

			sendPayload(messageClient, map[string]interface{}{"Event": "updateScene", "Data": updateSceneData})
			sendPayload(messageClient, map[string]interface{}{
				"Event": "setUserId",
				"Data":  setUserData})

		case "joinRoom":
			var reqData types.JoinRoom
			err := util.ParsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			// ! remove a user from a room if connected
			user, _ := memory.GetClient(types.UserID(userId))
			if user != nil {
				services.RemoveUser(user.ID, user.RoomId)
			}

			resData, err := services.JoinRoom(types.UserID(userId), reqData)
			if err != nil {
				fmt.Printf("something went wrong joining the room: %s. %v\n", string(reqData.RoomId), err)
			}

			// ! ew there must be another way
			data := map[string]string{
				"roomId":   string(reqData.RoomId),
				"userName": reqData.UserName,
			}

			if err := memory.UpdateUser(userId, data); err != nil {
				fmt.Printf("failed to update client room: %v", err)
			}

			// ! Subscribe to the Redis channel for RoomId
			go memory.UserSubscribe(messageClient, reqData.RoomId)

			updateSceneData := types.UpdateScene{
				RoomId: string(reqData.RoomId),
				Users:  resData.Users,
			}

			memory.BroadcastRoom(reqData.RoomId, "updateScene", updateSceneData)

			type SetUser struct {
				UserId string `json:"userId"`
			}

			setUserData := SetUser{
				UserId: string(userId),
			}

			sendPayload(messageClient, map[string]interface{}{"Event": "updateScene", "Data": updateSceneData})
			sendPayload(messageClient, map[string]interface{}{
				"Event": "setUserId",
				"Data":  setUserData})

		case "broadcastMessage":
			var reqData types.Msg
			err := util.ParsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
				continue
			}

			user, err := memory.GetClient(reqData.From)
			if err != nil {
				fmt.Printf("client is not connected")
			}

			type MessageData struct {
				Msg  string `json:"msg"`
				From string `json:"from"`
			}

			var maxLenMsg int = 60

			payload := MessageData{
				Msg:  reqData.Msg,
				From: user.Username,
			}

			// ! limit max text size
			if len(reqData.Msg) > maxLenMsg {
				payload.Msg = reqData.Msg[:maxLenMsg]
			}

			// ! filter bad words
			// filter := lib.TextFilter()
			// cleanMsg := filter.CleanText(payload.Msg)
			// payload.Msg = cleanMsg

			memory.BroadcastRoom(reqData.RoomId, "broadcastMessage", payload)

		case "updatePosition":
			var reqData types.UpdateUserPos
			err := util.ParsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				continue
			}

			services.UpdateUserPosition(reqData.RoomId, types.UserID(reqData.UserId), reqData.Dest)

		case "leaveRoom":
			var reqData types.UserLeave
			err := util.ParsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				continue
			}

			fmt.Printf("From \"leaveRoom\". User is leaving: %v", reqData.UserId)

			user, err := memory.GetClient(types.UserID(reqData.UserId))
			if err != nil {
				fmt.Printf("client is not connected")
			}

			if err := memory.UpdateUser(types.UserID(reqData.UserId), map[string]string{
				"roomId": "",
			}); err != nil {
				fmt.Printf("couldn't update user's room id")
			}

			// ! removes the user from room
			services.RemoveUser(user.ID, user.RoomId)

			activeConnections.Delete(userId)

			return

		default:
			log.Println("Unknown event received:", payload.Event)
		}
	}
}

func sendPayload(mc *types.MessageClient, payload map[string]interface{}) error {
	JSONPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("something went wrong on sendPayload marshal: %v", err)
	}

	mc.Send <- JSONPayload

	return nil
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
