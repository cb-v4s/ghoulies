package ws

import (
	"core/config"
	"core/internal/lib"
	"core/internal/memory"
	"core/internal/server/services"
	"core/types"
	"core/util"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type UpdateScene struct {
	RoomId string       `json:"roomId"`
	Users  []types.User `json:"users"`
}

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
	// ! Extract token from headers
	token := c.Request.Header.Get("Authorization")
	fmt.Printf("token ----------->; %v\n", token)

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

	// * Register the new client to Redis
	activeConnections.Store(userId, client)
	memory.AddClient(client)
	log.Println("A user connected:", userConn.RemoteAddr())

	// ! this rans when infinite loop breaks
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

			client, err := memory.GetClient(userId)
			if err != nil {
				fmt.Printf("client is not connected")
			}

			fmt.Printf("LEAVING CLIENT:::::%v, roomId:::::%v\n", client.ID, client.RoomId)

			break
		}

		switch payload.Event {
		case "newRoom":
			var reqData types.NewRoom
			err := util.ParsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			resData, err := services.NewRoom(userConn, types.UserID(userId), reqData)
			if err != nil {
				fmt.Printf("something went wrong: %v\n", err)
			}

			data := map[string]string{"roomId": string(resData.RoomId), "userName": reqData.UserName}
			if err := memory.UpdateUser(userId, data); err != nil {
				fmt.Printf("failed to update client room: %v", err)
			}

			// ! Subscribe to the Redis channel for RoomId
			go memory.UserSubscribe(userConn, resData.RoomId)

			// updateSceneData := UpdateScene{
			// 	RoomId: string(resData.RoomId),
			// 	Users:  resData.Users,
			// }

			// if err := memory.BroadcastRoom("updateScene", updateSceneData, resData.RoomId); err != nil {
			// 	fmt.Printf("failed to broadcast to room: %s", reqData.RoomName)
			// }

		case "joinRoom":
			var reqData types.JoinRoom
			err := util.ParsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			resData, err := services.JoinRoom(userConn, types.UserID(userId), reqData)
			if err != nil {
				fmt.Printf("something went wrong joining the room: %s. %v\n", string(reqData.RoomId), err)
			}

			fmt.Printf("resData: %v", resData)

			// ! ew there must be another way
			data := map[string]string{
				"roomId":   string(reqData.RoomId),
				"userName": reqData.UserName,
			}

			if err := memory.UpdateUser(userId, data); err != nil {
				fmt.Printf("failed to update client room: %v", err)
			}

			// ! Subscribe to the Redis channel for RoomId
			go memory.UserSubscribe(userConn, reqData.RoomId)

			updateSceneData := UpdateScene{
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

			sendPayload(client, map[string]interface{}{"Event": "updateScene", "Data": updateSceneData})
			sendPayload(client, map[string]interface{}{
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

			fmt.Println("payload.Event =>", reqData)

			roomData, exists := memory.GetRoom(reqData.RoomId)

			if !exists {
				fmt.Printf("room not found")
				continue
			}

			userIdx := services.GetUserIdx(types.UserID(reqData.UserId), reqData.RoomId)
			if userIdx == -1 {
				fmt.Printf("user not found")
				continue
			}

			currentPos := roomData.Users[userIdx].Position
			posKey := fmt.Sprintf("%d,%d", currentPos.Row, currentPos.Col)

			var destRow, destCol int
			fmt.Sscanf(reqData.Dest, "%d,%d", &destRow, &destCol)

			facingDirection := util.GetUserFacingDir(currentPos, lib.Position{Row: destRow, Col: destCol})

			invalidPositions := roomData.UsersPositions

			path := lib.FindPath(currentPos.Row, currentPos.Col, destRow, destCol, services.GridSize, invalidPositions)

			if len(path) == 0 {
				continue
			}

			for _, newPosition := range path {
				roomData.UsersPositions = util.DeleteFromSlice(roomData.UsersPositions, posKey)

				roomData.Users[userIdx].Position = newPosition
				roomData.Users[userIdx].Direction = facingDirection
				newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)

				roomData.UsersPositions = append(roomData.UsersPositions, newPosKey)
				memory.UpdateRoom(reqData.RoomId, roomData)

				updateSceneData := UpdateScene{
					RoomId: string(reqData.RoomId),
					Users:  roomData.Users,
				}

				memory.BroadcastRoom(reqData.RoomId, "updateScene", updateSceneData)

				// Simulate movement delay
				time.Sleep(time.Duration(services.SpeedUserMov) * time.Millisecond)

				posKey = newPosKey
			}

			// fmt.Printf("Invalid positions: %v\n", invalidPositions)

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

func sendPayload(client *types.Client, payload map[string]interface{}) error {
	client.ConnMu.Lock()
	defer client.ConnMu.Unlock()
	if err := client.Conn.WriteJSON(payload); err != nil {
		client.Conn.Close()
		return fmt.Errorf("error: %v", err)
	}

	return nil
}
