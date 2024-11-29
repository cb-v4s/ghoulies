package services

import (
	"core/internal/adapters/memory"
	lib "core/internal/core"
	util "core/internal/utils"
	types "core/types"
	"encoding/json"
	"fmt"
	mathRand "math/rand"
	"sync"
	"time"
)

const (
	GridSize  = 10
	RoomLimit = 10
)

type JoinRoomResponse struct {
	Users []types.User
}

func deleteFromSlice(target []string, value string) []string {
	for idx, v := range target {
		if v == value {
			return append(target[:idx], target[idx+1:]...)
		}
	}

	return target
}

func Contains(target []string, value string) bool {
	for _, v := range target {
		if v == value {
			return true
		}
	}

	return false
}

func newRoomId(roomName string) (*types.RoomId, error) {
	randomId, err := util.GetRandomId()
	if err != nil {
		return nil, fmt.Errorf("error generating random id: %v", err)
	}

	id := fmt.Sprintf(types.RoomIdFormat, roomName, randomId)
	roomId := types.RoomId(id)

	return &roomId, nil
}

// Check if the room is full
func IsRoomFull(roomId types.RoomId) bool {
	roomData, exists := memory.GetRoom(roomId)
	return exists && len(roomData.Users) >= RoomLimit
}

func RemoveUser(userId types.UserID, roomId types.RoomId) {
	room, exists := memory.GetRoom(roomId)
	if !exists {
		return
	}

	userIdx, exists := room.UserIdxMap[userId]
	if !exists {
		fmt.Printf("User not found\n")
		return
	}

	// Remove position from UsersPositions
	pos := room.Users[userIdx].Position
	room.UsersPositions = deleteFromSlice(room.UsersPositions, fmt.Sprintf("%d,%d", pos.Row, pos.Col))

	// Replace the user with the last user for O(1) operation
	lastIdx := len(room.Users) - 1
	if lastIdx != int(userIdx) { // Only update if we're not removing the last user
		room.Users[userIdx] = room.Users[lastIdx]
		room.UserIdxMap[room.Users[userIdx].UserID] = userIdx
	}

	room.Users = room.Users[:lastIdx] // Remove last user

	// Remove the user from the index map
	delete(room.UserIdxMap, userId)

	fmt.Printf("Users in the room: %s total: %d\n", roomId, len(room.Users))

	// Check if the room is empty
	if len(room.Users) == 0 {
		memory.DeleteRoom(roomId)
	}

	memory.UpdateRoom(roomId, room)
}

type NewRoomResponse struct {
	RoomId types.RoomId
	Users  []types.User
}

func UpdateUserTyping(roomId types.RoomId, userId types.UserID, isTyping bool) {
	room, exists := memory.GetRoom(roomId)

	if !exists {
		fmt.Printf("room not found")
		return
	}

	userIdx, exists := room.UserIdxMap[userId]
	if !exists {
		fmt.Printf("user not found")
		return
	}

	if room.Users[userIdx].IsTyping != isTyping {
		room.Users[userIdx].IsTyping = isTyping
		memory.UpdateRoom(roomId, room)

		updateSceneData := types.UpdateScene{
			RoomId: string(roomId),
			Users:  room.Users,
		}

		memory.BroadcastRoom(roomId, "updateScene", updateSceneData)
	}
}

// ! movements are not perfect
// TODO:
func getUserFacingDir(origin types.Position, target types.Position) types.FacingDirection {

	deltaX := target.Row - origin.Row
	deltaY := target.Col - origin.Col

	if deltaY == 0 { // Horizontal movement only
		if deltaX > 0 {
			// fmt.Println("Moving right")
			return types.FrontRight // Moving right
		} else if deltaX < 0 {
			// fmt.Println("Moving left")
			return types.BackLeft // Moving left
		}
	} else if deltaX == 0 { // Vertical movement only
		if deltaY > 0 {
			return types.FrontLeft // Moving down
		} else if deltaY < 0 {
			return types.FrontRight // Moving up
		}
	} else if deltaX > 0 && deltaY > 0 {
		// fmt.Println("Moving down-right", deltaX, deltaY)
		if deltaX == 1 {
			return types.FrontLeft
		}

		return types.FrontRight // Moving down-right
	} else if deltaX < 0 && deltaY > 0 {
		// fmt.Println("Moving down-left")
		return types.FrontLeft // Moving down-left
	} else if deltaX < 0 && deltaY < 0 {
		// fmt.Println("Moving up-left")
		return types.BackLeft // Moving up-left
	} else if deltaX > 0 && deltaY < 0 {
		// fmt.Println("Moving up-right", deltaX, deltaY)

		if deltaX == 1 {
			return types.FrontRight // Moving up-right
		}

		return types.BackRight // Moving up-right
	}

	return types.FrontRight
}

func UpdateUserPosition(roomId types.RoomId, userId types.UserID, dest string) {
	room, exists := memory.GetRoom(roomId)

	if !exists {
		fmt.Printf("room not found")
		return
	}

	userIdx, exists := room.UserIdxMap[types.UserID(userId)]
	if !exists {
		fmt.Printf("user not found")
		return
	}

	currentPos := room.Users[userIdx].Position
	posKey := fmt.Sprintf("%d,%d", currentPos.Row, currentPos.Col)

	var destRow, destCol int
	fmt.Sscanf(dest, "%d,%d", &destRow, &destCol)

	if currentPos.Row == destRow && currentPos.Col == destCol {
		return
	}

	facingDirection := getUserFacingDir(currentPos, types.Position{Row: destRow, Col: destCol})

	invalidPositions := room.UsersPositions

	path := lib.FindPath(currentPos.Row, currentPos.Col, destRow, destCol, GridSize, invalidPositions)

	if len(path) == 0 {
		return
	}

	const speedUserMov int = 180

	for _, newPosition := range path {
		room.UsersPositions = deleteFromSlice(room.UsersPositions, posKey)

		room.Users[userIdx].Position = newPosition
		room.Users[userIdx].Direction = facingDirection
		newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)

		room.UsersPositions = append(room.UsersPositions, newPosKey)
		memory.UpdateRoom(roomId, room)

		updateSceneData := types.UpdateScene{
			RoomId: string(roomId),
			Users:  room.Users,
		}

		memory.BroadcastRoom(roomId, "updateScene", updateSceneData)

		// Simulate movement delay
		time.Sleep(time.Duration(speedUserMov) * time.Millisecond)

		posKey = newPosKey
	}

	fmt.Printf("Invalid positions: %v\n", invalidPositions)
}

// Get a random position in the room
func getRandomEmptyPosition(occupiedPositions []string, max int) (string, types.Position) {
	for {
		row := mathRand.Intn(max)
		col := mathRand.Intn(max)
		var strPos string = fmt.Sprintf("%d,%d", row, col)

		exists := Contains(
			occupiedPositions,
			strPos,
		)

		if !exists {
			return strPos, types.Position{Row: row, Col: col}
		}
	}
}

func JoinRoom(reqData types.JoinRoom, messageClient *types.MessageClient, userId types.UserID) {
	// ! TODO: remove a user from a room if connected
	user, _ := memory.GetClient(types.UserID(userId))
	if len(user.RoomId) > 0 {
		RemoveUser(user.ID, user.RoomId)
	}

	if IsRoomFull(reqData.RoomId) {
		fmt.Println("error_room_full")
		return
	}

	// Check if the room already exists
	roomData, exists := memory.GetRoom(reqData.RoomId)

	fmt.Printf("roomData: %v, exists: %v\n", roomData, exists)

	// Set initial position
	newPosition := types.Position{Row: 0, Col: 0}

	// Create new user
	newUser := types.User{
		UserName:  reqData.UserName,
		UserID:    userId,
		RoomID:    string(reqData.RoomId),
		Position:  newPosition,
		Direction: types.DefaultDirection,
		IsTyping:  false,
	}

	fmt.Printf("Updating room: %s\n", reqData.RoomId)
	newPositionStr, newPosition := getRandomEmptyPosition(roomData.UsersPositions, 9)
	newUser.Position = newPosition

	roomData.Users = append(roomData.Users, newUser)
	roomData.UsersPositions = append(roomData.UsersPositions, newPositionStr)
	roomData.UserIdxMap[userId] = types.UserIdx(len(roomData.Users) - 1)

	fmt.Printf("roomData: %v\n", roomData)

	memory.UpdateRoom(reqData.RoomId, roomData)

	data := &types.UpdateUser{
		RoomId:   (*string)(&reqData.RoomId),
		UserName: &reqData.UserName,
	}

	if err := memory.UpdateUser(userId, data); err != nil {
		fmt.Printf("failed to update client room: %v", err)
	}

	// ! Subscribe to the Redis channel for RoomId
	go memory.UserSubscribe(messageClient, reqData.RoomId)

	updateSceneData := types.UpdateScene{
		RoomId: string(reqData.RoomId),
		Users:  roomData.Users,
	}

	memory.BroadcastRoom(reqData.RoomId, "updateScene", updateSceneData)

	type SetUser struct {
		UserId string `json:"userId"`
	}

	setUserData := SetUser{
		UserId: string(userId),
	}

	SendPayload(messageClient, types.WsPayload{
		Event: "updateScene",
		Data:  updateSceneData,
	})

	SendPayload(messageClient, types.WsPayload{
		Event: "setUserId",
		Data:  setUserData,
	})
}

func BroadcastMessage(reqData types.Msg, messageClient *types.MessageClient, userId types.UserID) {
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

	fmt.Println("sending message:", reqData.Msg)

	// ! limit max text size
	if len(reqData.Msg) > maxLenMsg {
		payload.Msg = reqData.Msg[:maxLenMsg]
	}

	// ! filter bad words
	// filter := lib.TextFilter()
	// cleanMsg := filter.CleanText(payload.Msg)
	// payload.Msg = cleanMsg

	memory.BroadcastRoom(reqData.RoomId, "broadcastMessage", payload)
}

func NewRoom(reqData types.NewRoom, messageClient *types.MessageClient, userId types.UserID) {
	// ! remove a user from a room if connected
	user, _ := memory.GetClient(types.UserID(userId))
	if len(user.RoomId) > 0 {
		RemoveUser(user.ID, user.RoomId)
	}

	// Set initial position
	newPosition := types.Position{Row: 0, Col: 0}

	// Create new user
	newUser := types.User{
		UserName:  reqData.UserName,
		UserID:    userId,
		RoomID:    reqData.RoomName,
		Position:  newPosition,
		Direction: types.DefaultDirection,
		IsTyping:  false,
	}

	roomData := types.RoomData{
		Name:           reqData.RoomName,
		Users:          []types.User{},
		UsersPositions: []string{},
		UserIdxMap:     make(map[types.UserID]types.UserIdx),
	}

	// Add new user data to the room
	roomData.Users = append(roomData.Users, newUser)
	roomData.UsersPositions = append(roomData.UsersPositions, fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col))
	roomData.UserIdxMap[userId] = 0

	roomId, err := newRoomId(reqData.RoomName)
	if err != nil {
		fmt.Printf("failed to generate randomId")
		return
	}

	_, exists := memory.GetRoom(*roomId)
	if exists {
		fmt.Printf("Room already exists")
		return
	}

	memory.CreateRoom(reqData.RoomName, *roomId, roomData)

	data := &types.UpdateUser{
		RoomId:   (*string)(roomId),
		UserName: &reqData.UserName,
	}

	if err := memory.UpdateUser(userId, data); err != nil {
		fmt.Printf("failed to update client room: %v", err)
		return
	}

	// ! Subscribe to the Redis channel for RoomId
	go memory.UserSubscribe(messageClient, *roomId)

	updateSceneData := types.UpdateScene{
		RoomId: string(*roomId),
		Users:  roomData.Users,
	}

	memory.BroadcastRoom(types.RoomId(*roomId), "updateScene", updateSceneData)

	type SetUser struct {
		UserId string `json:"userId"`
	}

	setUserData := SetUser{
		UserId: string(userId),
	}

	SendPayload(messageClient, types.WsPayload{
		Event: "updateScene",
		Data:  updateSceneData,
	})

	SendPayload(messageClient, types.WsPayload{
		Event: "setUserId",
		Data:  setUserData,
	})
}

func LeaveRoom(reqData types.UserLeave, userId types.UserID, activeConnections *sync.Map) {
	fmt.Printf("From \"leaveRoom\". User is leaving: %v", reqData.UserId)

	user, err := memory.GetClient(types.UserID(reqData.UserId))
	if err != nil {
		fmt.Printf("client is not connected")
	}

	emptyRoomId := ""
	updateData := &types.UpdateUser{
		RoomId: &emptyRoomId,
	}

	if err := memory.UpdateUser(types.UserID(reqData.UserId), updateData); err != nil {
		fmt.Printf("couldn't update user's room id")
	}

	// ! removes the user from room
	RemoveUser(user.ID, user.RoomId)

	activeConnections.Delete(userId)
}

func SendPayload(mc *types.MessageClient, payload types.WsPayload) error {
	JSONPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("something went wrong on sendPayload marshal: %v", err)
	}

	mc.Send <- JSONPayload

	return nil
}
