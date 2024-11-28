package services

import (
	"core/internal/lib"
	"core/internal/memory"
	types "core/types"
	"core/util"
	"fmt"
	"time"
)

const (
	SpeedUserMov = 180
	GridSize     = 10
	RoomLimit    = 10
	userIdAI     = "ghosty"
)

// Check if the room is full
func IsRoomFull(roomId types.RoomId) bool {
	roomData, exists := memory.GetRoom(roomId)
	return exists && len(roomData.Users) >= RoomLimit
}

// Get the user index in the specified room
// ! WTF REMOVE THIS
func GetUserIdx(userId types.UserID, roomId types.RoomId) types.UserIdx {

	room, exists := memory.GetRoom(roomId)
	if !exists {
		return -1
	}

	userIdx, exists := room.UserIdxMap[userId]
	if !exists {
		return -1
	}

	return userIdx
}

func RemoveUser(userId types.UserID, roomId types.RoomId) {
	room, exists := memory.GetRoom(roomId)
	if !exists {
		return
	}

	userIdx := GetUserIdx(userId, roomId)
	if userIdx == -1 {
		fmt.Printf("User not found\n")
		return
	}

	// Remove position from UsersPositions
	pos := room.Users[userIdx].Position
	strPos := util.PositionToString(pos)
	room.UsersPositions = util.DeleteFromSlice(room.UsersPositions, strPos)

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
	roomData, exists := memory.GetRoom(roomId)

	if !exists {
		fmt.Printf("room not found")
		return
	}

	userIdx := GetUserIdx(userId, roomId)
	if userIdx == -1 {
		fmt.Printf("user not found")
		return
	}

	if roomData.Users[userIdx].IsTyping != isTyping {
		roomData.Users[userIdx].IsTyping = isTyping
		memory.UpdateRoom(roomId, roomData)

		updateSceneData := types.UpdateScene{
			RoomId: string(roomId),
			Users:  roomData.Users,
		}

		memory.BroadcastRoom(roomId, "updateScene", updateSceneData)
	}
}

func UpdateUserPosition(roomId types.RoomId, userId types.UserID, dest string) {
	roomData, exists := memory.GetRoom(roomId)

	if !exists {
		fmt.Printf("room not found")
		return
	}

	// ! WTF XD
	userIdx := GetUserIdx(types.UserID(userId), roomId)
	if userIdx == -1 {
		fmt.Printf("user not found")
		return
	}

	currentPos := roomData.Users[userIdx].Position
	posKey := fmt.Sprintf("%d,%d", currentPos.Row, currentPos.Col)

	var destRow, destCol int
	fmt.Sscanf(dest, "%d,%d", &destRow, &destCol)

	if currentPos.Row == destRow && currentPos.Col == destCol {
		return
	}

	facingDirection := util.GetUserFacingDir(currentPos, lib.Position{Row: destRow, Col: destCol})

	invalidPositions := roomData.UsersPositions

	path := lib.FindPath(currentPos.Row, currentPos.Col, destRow, destCol, GridSize, invalidPositions)

	if len(path) == 0 {
		return
	}

	for _, newPosition := range path {
		roomData.UsersPositions = util.DeleteFromSlice(roomData.UsersPositions, posKey)

		roomData.Users[userIdx].Position = newPosition
		roomData.Users[userIdx].Direction = facingDirection
		newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)

		roomData.UsersPositions = append(roomData.UsersPositions, newPosKey)
		memory.UpdateRoom(roomId, roomData)

		updateSceneData := types.UpdateScene{
			RoomId: string(roomId),
			Users:  roomData.Users,
		}

		memory.BroadcastRoom(roomId, "updateScene", updateSceneData)

		// Simulate movement delay
		time.Sleep(time.Duration(SpeedUserMov) * time.Millisecond)

		posKey = newPosKey
	}

	fmt.Printf("Invalid positions: %v\n", invalidPositions)
}

func NewRoom(userId types.UserID, data types.NewRoom) (*NewRoomResponse, error) {
	// Set initial position
	newPosition := lib.Position{Row: 0, Col: 0}

	// Create new user
	newUser := types.User{
		UserName:  data.UserName,
		UserID:    userId,
		RoomID:    data.RoomName,
		Position:  newPosition,
		Direction: types.DefaultDirection,
		IsTyping:  false,
	}

	roomData := types.RoomData{
		Name:           data.RoomName,
		Users:          []types.User{},
		UsersPositions: []string{},
		UserIdxMap:     make(map[types.UserID]types.UserIdx),
	}

	// Add new user data to the room
	roomData.Users = append(roomData.Users, newUser)
	roomData.UsersPositions = append(roomData.UsersPositions, util.PositionToString(newPosition))
	roomData.UserIdxMap[userId] = 0

	for {
		roomId, err := util.NewRoomId(data.RoomName)
		if err != nil {
			return nil, fmt.Errorf("failed to generate randomId")
		}

		_, exists := memory.GetRoom(*roomId)
		if !exists {
			response := &NewRoomResponse{
				RoomId: *roomId,
				Users:  roomData.Users,
			}

			memory.CreateRoom(data.RoomName, *roomId, roomData)
			return response, nil
		}
	}

}

type JoinRoomResponse struct {
	Users []types.User
}

func JoinRoom(userId types.UserID, data types.JoinRoom) (*JoinRoomResponse, error) {
	if IsRoomFull(data.RoomId) {
		return nil, fmt.Errorf("error_room_full")
	}

	// Check if the room already exists
	roomData, exists := memory.GetRoom(data.RoomId)

	fmt.Printf("roomData: %v, exists: %v\n", roomData, exists)

	// Set initial position
	newPosition := lib.Position{Row: 0, Col: 0}

	// Create new user
	newUser := types.User{
		UserName:  data.UserName,
		UserID:    userId,
		RoomID:    string(data.RoomId),
		Position:  newPosition,
		Direction: types.DefaultDirection,
		IsTyping:  false,
	}

	fmt.Printf("Updating room: %s\n", data.RoomId)
	newPositionStr, newPosition := util.GetRandomEmptyPosition(roomData.UsersPositions, 9)
	newUser.Position = newPosition

	roomData.Users = append(roomData.Users, newUser)
	roomData.UsersPositions = append(roomData.UsersPositions, newPositionStr)
	roomData.UserIdxMap[userId] = types.UserIdx(len(roomData.Users) - 1)

	fmt.Printf("roomData: %v\n", roomData)

	response := &JoinRoomResponse{
		Users: roomData.Users,
	}

	memory.UpdateRoom(data.RoomId, roomData)
	return response, nil
}
