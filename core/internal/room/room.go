package room

import (
	"core/config"
	"core/internal/lib"
	types "core/types"
	"core/util"
	"fmt"

	"github.com/gorilla/websocket"
	"golang.org/x/exp/rand"
)

const (
	SpeedUserMov = 220
	GridSize     = 10
	RoomLimit    = 10
)

var RoomHdl *types.RoomHandler

func NewRoomHandler() *types.RoomHandler {
	newRoom := &types.RoomHandler{
		Rooms: make(map[string]*types.RoomData), // Initialize the Rooms map
	}

	// Create a default room that will always exist
	newRoom.Rooms[config.DefaultRoom] = &types.RoomData{
		Users:          []types.User{},
		UsersPositions: []string{},                           // Initialize as empty map for set behavior
		UserIdxMap:     make(map[types.UserID]types.UserIdx), // Initialize as empty map for user indices
	}

	return newRoom
}

// Check if the room is full
func IsRoomFull(rh *types.RoomHandler, roomID string) bool {
	rh.Mu.Lock()
	defer rh.Mu.Unlock()
	roomData, exists := rh.Rooms[roomID]
	return exists && len(roomData.Users) >= RoomLimit
}

// Get the user index in the specified room
func GetUserIdx(rh *types.RoomHandler, userID types.UserID, roomID string) types.UserIdx {
	rh.Mu.Lock()
	defer rh.Mu.Unlock()
	if roomData, exists := rh.Rooms[roomID]; exists {
		return roomData.UserIdxMap[userID]
	}
	return -1 // Return -1 if user not found
}

// Get a random position in the room
func GetRandomEmptyPosition(rh *types.RoomHandler, occPositions []string) (string, lib.Position) {
	for {
		row := rand.Intn(GridSize)
		col := rand.Intn(GridSize)
		var strPos string = fmt.Sprintf("%d,%d", row, col)

		exists := util.Contains(
			occPositions,
			strPos,
		)

		if !exists {
			return strPos, lib.Position{Row: row, Col: col}
		}
	}
}

// TODO check if this is working
func RemoveUser(rh *types.RoomHandler, userID types.UserID, roomID string) {
	rh.Mu.Lock()
	defer rh.Mu.Unlock()

	roomData, exists := rh.Rooms[roomID]
	if !exists {
		return
	}

	idx, exists := roomData.UserIdxMap[userID]
	if !exists {
		return // User not found
	}

	// Remove position from UsersPositions
	pos := roomData.Users[idx].Position
	posKey := fmt.Sprintf("%d,%d", pos.Row, pos.Col)
	util.Delete(roomData.UsersPositions, posKey)

	// Replace the user with the last user for O(1) removal
	lastIdx := len(roomData.Users) - 1
	roomData.Users[idx] = roomData.Users[lastIdx]
	roomData.Users = roomData.Users[:lastIdx] // Remove last user

	// Update UserIdxMap
	roomData.UserIdxMap[roomData.Users[idx].UserID] = idx
	delete(roomData.UserIdxMap, userID)

	// Check if the room is empty
	if len(roomData.Users) == 0 {
		delete(rh.Rooms, roomID) // Delete room if empty
	}
}

func PositionToString(p lib.Position) string {
	return fmt.Sprintf("%d,%d", p.Row, p.Col)
}

func CreateUser(socket *websocket.Conn, userId types.UserID, data types.CreateUserData) (error, string, map[string]interface{}) {
	// Check if the room is full
	if IsRoomFull(RoomHdl, data.RoomName) {
		response := map[string]interface{}{}

		return nil, "error_room_full", response
	}

	// Check if the room already exists
	roomData, exists := RoomHdl.Rooms[data.RoomName]

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
		newRoomData := &types.RoomData{
			Users:          []types.User{},
			UsersPositions: []string{},                           // Initialize as empty map for set behavior
			UserIdxMap:     make(map[types.UserID]types.UserIdx), // Initialize as empty map for user indices
		}

		// Add user to the room
		newRoomData.Users = append(newRoomData.Users, newUser)
		newRoomData.UsersPositions = append(newRoomData.UsersPositions, PositionToString(newPosition))

		newRoomData.UserIdxMap[userId] = 0

		RoomHdl.Rooms[data.RoomName] = newRoomData

	} else {
		newPositionStr, newPosition := GetRandomEmptyPosition(RoomHdl, roomData.UsersPositions)
		newUser.Position = newPosition

		// ? do i have to modify rooms like this or could i just modify roomData?
		RoomHdl.Rooms[data.RoomName].Users = append(roomData.Users, newUser)
		RoomHdl.Rooms[data.RoomName].UsersPositions = append(roomData.UsersPositions, newPositionStr)
		RoomHdl.Rooms[data.RoomName].UserIdxMap[userId] = types.UserIdx(len(roomData.Users) - 1)
	}

	response := map[string]interface{}{
		"gridSize": GridSize,
		"users":    RoomHdl.Rooms[data.RoomName].Users,
	}

	// return initMap
	return nil, "NewUser", response
}
