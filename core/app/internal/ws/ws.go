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
	activeIPAddresses   = make(map[net.Addr]int)
	activeIPAddressesMu sync.Mutex
)

// HandleWebSocket handles incoming WebSocket connections.
func HandleWebSocket(c *gin.Context) {
	// ! Extract token from headers
	// token := c.Request.Header.Get("Authorization")
	// userId, err := extractUserIdFromToken(token) // Validate token and get user ID
	// if err != nil {
	// 	// Handle error (e.g., unauthorized)
	// 	return
	// }

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
		RoomId: "",
	}

	// * Register the new client to Redis
	memory.AddClient(client)
	log.Println("A user connected:", userConn.RemoteAddr())

	defer func() {
		fmt.Printf("User is leaving: %v", userId)
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
		case "newRoom":
			var reqData types.NewRoom
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			resData, err := services.NewRoom(userConn, types.UserID(userId), reqData)
			if err != nil {
				fmt.Printf("something went wrong: %v\n", err)
			}

			if err := memory.UpdateUserRoom(userId, resData.RoomId); err != nil {
				fmt.Printf("failed to update client room: %v", err)
			}

			// ! Subscribe to the Redis channel for RoomId
			go memory.UserSubscribe(userConn, resData.RoomId)

			updateSceneData := UpdateScene{
				RoomId: string(resData.RoomId),
				Users:  resData.Users,
			}

			if err := broadcastRoom("updateScene", updateSceneData, resData.RoomId); err != nil {
				fmt.Printf("failed to broadcast to room: %s", reqData.RoomName)
			}

		case "joinRoom":
			var reqData types.JoinRoom
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
			}

			resData, err := services.JoinRoom(userConn, types.UserID(userId), reqData)
			if err != nil {
				fmt.Printf("something went wrong joining the room: %s. %v\n", string(reqData.RoomId), err)
			}

			fmt.Printf("resData: %v", resData)

			if err := memory.UpdateUserRoom(userId, reqData.RoomId); err != nil {
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

			sendPayload(userConn, map[string]interface{}{"Event": "updateScene", "Data": updateSceneData})
			sendPayload(userConn, map[string]interface{}{
				"Event": "setUserId",
				"Data":  setUserData})

		case "broadcastMessage":
			var reqData types.Msg
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s\n", err)
				continue
			}

			type MessageData struct {
				Msg  string `json:"msg"`
				From string `json:"from"`
			}

			payload := MessageData{
				Msg:  reqData.Msg,
				From: string(reqData.From),
			}

			// TODO:
			// memory.GetClient().RoomId
			// if client.RoomId != reqData.RoomId {
			// 	fmt.Println("Operation not allowed.")
			// 	continue
			// }

			memory.BroadcastRoom(reqData.RoomId, "broadcastMessage", payload)

		case "updatePosition":
			var reqData types.UpdateUserPos
			err := parsePayload(payload.Data, &reqData)
			if err != nil {
				fmt.Printf("Error: %s", err)
				continue
			}

			fmt.Println("payload.Event =>", reqData)

			var row, col int
			fmt.Sscanf(reqData.Dest, "%d,%d", &row, &col)

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

			invalidPositions := roomData.UsersPositions

			fmt.Printf("Invalid positions: %v\n", invalidPositions)

			// Find path to the destination (implement findPath)
			path := lib.FindPath(currentPos.Row, currentPos.Col, row, col, services.GridSize, []string{}) // invalidPositions
			fmt.Printf("Path: %v\n", path)

			if len(path) == 0 {
				fmt.Printf("no valid path")
				continue
			}

			// TODO:
			// ? move to background (a go routine) ?
			// ? also will this update redis data ?
			for _, newPosition := range path {
				fmt.Printf("newPosition: %v\n", newPosition)

				roomData.Users[userIdx].Position = newPosition
				newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)
				roomData.UsersPositions = append(roomData.UsersPositions, newPosKey)

				// ! updates room
				memory.UpdateRoom(reqData.RoomId, roomData)

				updateSceneData := UpdateScene{
					RoomId: string(reqData.RoomId),
					Users:  roomData.Users,
				}

				memory.BroadcastRoom(reqData.RoomId, "updateScene", updateSceneData)

				// Simulate movement delay
				time.Sleep(time.Duration(services.SpeedUserMov) * time.Millisecond)

				util.Delete(roomData.UsersPositions, posKey) // TODO: make this func name more descriptive
				posKey = newPosKey
			}

		default:
			log.Println("Unknown event received:", payload.Event)
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

func broadcastRoom(eventName string, data any, roomId types.RoomId) error {
	return nil
	// payload := make(map[string]interface{})
	// payload["Event"] = eventName
	// payload["Data"] = data

	// fmt.Printf("from broadcastRoom: %v\n", payload)

	// room, exists := memory.GetRoom(roomId)
	// if !exists {
	// 	return fmt.Errorf("room does not exist")
	// }

	// ctx, cancelCtx := memory.NewContextWithTimeout(10 * time.Second)
	// defer cancelCtx()

	// // Publish to Redis
	// return memory.RedisClient.Publish(ctx, roomId, payload).Err()
}

func sendDirect(eventName string, userId types.UserID, data map[string]interface{}) error {
	// TODO: uncomment
	// user, err := memory.GetClient(userId)
	// if err != nil {
	// 	return fmt.Errorf("client is not connected")
	// }

	// if err := sendPayload(user.Conn, map[string]interface{}{
	// 	"Event": eventName,
	// 	"Data":  data,
	// }); err != nil {
	// 	return fmt.Errorf("failed to send payload to %v. %v", user.Conn.RemoteAddr(), err)
	// }

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
	// TODO: uncomment
	// userData.Conn.Close()
	return nil
}
