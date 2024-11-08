package services

import (
	"core/internal/lib"
	"core/internal/memory"
	types "core/types"
	"core/util"
	"fmt"
	"math"

	"github.com/gorilla/websocket"
	"golang.org/x/exp/rand"
)

const (
	SpeedUserMov = 220
	GridSize     = 10
	RoomLimit    = 10
)

// Check if the room is full
func IsRoomFull(roomId string) bool {
	roomData, exists := memory.GetRoom(roomId)
	return exists && len(roomData.Users) >= RoomLimit
}

// Get the user index in the specified room
func GetUserIdx(userId types.UserID, roomId string) types.UserIdx {

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

// Get a random position in the room
func GetRandomEmptyPosition(occupiedPositions []string) (string, lib.Position) {
	for {
		row := rand.Intn(GridSize)
		col := rand.Intn(GridSize)
		var strPos string = fmt.Sprintf("%d,%d", row, col)

		exists := util.Contains(
			occupiedPositions,
			strPos,
		)

		if !exists {
			return strPos, lib.Position{Row: row, Col: col}
		}
	}
}

// TODO check if this is working
func RemoveUser(userId types.UserID, roomId string) {
	room, exists := memory.GetRoom(string(roomId))
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
	util.Delete(room.UsersPositions, PositionToString(lib.Position{Row: pos.Row, Col: pos.Col}))

	// Replace the user with the last user for O(1) operation
	lastIdx := len(room.Users) - 1
	if lastIdx != int(userIdx) { // Only update if we're not removing the last user
		room.Users[userIdx] = room.Users[lastIdx]
		room.UserIdxMap[room.Users[userIdx].UserID] = userIdx
	}

	room.Users = room.Users[:lastIdx] // Remove last user

	// Remove the user from the index map
	delete(room.UserIdxMap, userId)

	// Check if the room is empty
	if len(room.Users) == 0 {
		memory.DeleteRoom(roomId)
	}
}

func PositionToString(p lib.Position) string {
	return fmt.Sprintf("%d,%d", p.Row, p.Col)
}

func CreateUser(socket *websocket.Conn, userId types.UserID, data types.CreateUserData) (error, string, map[string]interface{}) {

	if len(data.RoomId) > 0 {
		// Check if the room is full
		if IsRoomFull(data.RoomId) {
			response := map[string]interface{}{}

			// ! TODO: do not mix logic, a wsEvent should only be handle by wsHandler
			return nil, "error_room_full", response
		}
	}

	// Existing room

	// Check if the room already exists
	roomData, exists := memory.GetRoom(data.RoomId)

	// Set initial position
	newPosition := lib.Position{Row: 0, Col: 0} // Initial position

	// Create new user
	newUser := types.User{
		UserName:    data.UserName,
		UserID:      userId,
		Connection:  socket,
		RoomID:      data.RoomName,
		Position:    newPosition,
		Avatar:      types.DefaultAvatars[data.AvatarId],
		AvatarXAxis: types.Right,
	}

	if !exists {
		roomData := &types.RoomData{
			Users:          []types.User{},
			UsersPositions: []string{},                           // Initialize as empty map for set behavior
			UserIdxMap:     make(map[types.UserID]types.UserIdx), // Initialize as empty map for user indices
		}

		// Add user to the room
		roomData.Users = append(roomData.Users, newUser)
		roomData.UsersPositions = append(roomData.UsersPositions, PositionToString(newPosition))

		roomData.UserIdxMap[userId] = 0

		memory.CreateRoom(data.RoomName)
	} else {
		newPositionStr, newPosition := GetRandomEmptyPosition(roomData.UsersPositions)
		newUser.Position = newPosition

		// ? do i have to modify rooms like this or could i just modify roomData?
		roomData.Users = append(roomData.Users, newUser)
		roomData.UsersPositions = append(roomData.UsersPositions, newPositionStr)
		roomData.UserIdxMap[userId] = types.UserIdx(len(roomData.Users) - 1)

		memory.UpdateRoom(data.RoomId, roomData)
	}

	response := map[string]interface{}{
		"gridSize": GridSize,
		"users":    roomData.Users,
	}

	// return initMap
	return nil, "NewUser", response
}

func GetUserFacingDir(origin lib.Position, target lib.Position) types.XAxis {
	var updatedXAxis types.XAxis = types.Right

	deltaRow := target.Row - origin.Row
	deltaCol := target.Col - origin.Col

	if deltaCol > 0 {
		updatedXAxis = types.Right
	} else if deltaCol < 0 {
		updatedXAxis = types.Left
	}

	// Diagonal movement
	if math.Abs(float64(deltaRow)) == math.Abs(float64(deltaCol)) {
		if deltaCol > 0 && deltaRow < 0 {
			updatedXAxis = types.Right
		} else if deltaCol < 0 && deltaRow > 0 {
			updatedXAxis = types.Left
		}
	}

	return updatedXAxis
}
