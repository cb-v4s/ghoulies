package room

import (
	"core/internal/lib"
	"core/types"
	"fmt"
	"sync"
	"time"

	"golang.org/x/exp/rand"
)

const (
	speedUserMov = 220
	gridSize     = 10
	roomLimit    = 10
)

type RoomHandler struct {
	Rooms map[string]*RoomData
	mu    sync.Mutex // Mutex to protect access to Rooms
}

type RoomData struct {
	Users          []types.User
	UsersPositions map[string]struct{}
	UserIdxMap     map[string]int
}

// Check if the room is full
func (rh *RoomHandler) IsRoomFull(roomID string) bool {
	rh.mu.Lock()
	defer rh.mu.Unlock()
	roomData, exists := rh.Rooms[roomID]
	return exists && len(roomData.Users) >= roomLimit
}

// Get the user index in the specified room
func (rh *RoomHandler) GetUserIdx(userID string, roomID string) int {
	rh.mu.Lock()
	defer rh.mu.Unlock()
	if roomData, exists := rh.Rooms[roomID]; exists {
		return roomData.UserIdxMap[userID]
	}
	return -1 // Return -1 if user not found
}

// Get a random position in the room
func (rh *RoomHandler) GetRandomPosition(room *RoomData) (int, int) {
	for {
		row := rand.Intn(gridSize)
		col := rand.Intn(gridSize)
		posKey := fmt.Sprintf("%d,%d", row, col)
		if _, exists := room.UsersPositions[posKey]; !exists {
			return row, col
		}
	}
}

// Function to convert UsersPositions map to a slice of Position
func convertMapToSlice(usersPositions map[string]struct{}) []lib.Position {
	positions := []lib.Position{}
	for key := range usersPositions {
		var row, col int
		// Assuming your key format is "row,col", you can parse it
		fmt.Sscanf(key, "%d,%d", &row, &col)
		positions = append(positions, lib.Position{Row: row, Col: col})
	}
	return positions
}

// Update the user's position in the room
func (rh *RoomHandler) UpdatePosition(dest lib.Position, roomID string, userID string /*, io *Server*/) {
	rh.mu.Lock()
	roomData, exists := rh.Rooms[roomID]
	rh.mu.Unlock()

	if !exists {
		return
	}

	idx := rh.GetUserIdx(userID, roomID)
	if idx == -1 {
		return // User not found
	}

	currentPos := roomData.Users[idx].Position
	posKey := fmt.Sprintf("%d,%d", currentPos.Row, currentPos.Col)

	// Remove current position from UsersPositions
	delete(roomData.UsersPositions, posKey)

	invalidPositions := convertMapToSlice(roomData.UsersPositions)

	// Find path to the destination (implement findPath)
	path := lib.FindPath(currentPos.Row, currentPos.Col, dest.Row, dest.Col, gridSize, invalidPositions)

	if len(path) == 0 {
		return // No valid path
	}

	// * Move the user along the path (this can be implemented as a goroutine for async movement)
	go func() {
		for _, newPosition := range path {
			roomData.Users[idx].Position = newPosition
			newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)
			roomData.UsersPositions[newPosKey] = struct{}{}

			// TODO: uncomment
			// io.To(roomID).Emit("updateMap", roomData.Users)

			time.Sleep(time.Duration(speedUserMov) * time.Millisecond) // Simulate movement delay
		}
	}()
}

// Remove a user from the room
func (rh *RoomHandler) RemoveUser(userID string, roomID string) {
	rh.mu.Lock()
	defer rh.mu.Unlock()

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
	delete(roomData.UsersPositions, posKey)

	// Replace the user with the last user for O(1) removal
	lastIdx := len(roomData.Users) - 1
	roomData.Users[idx] = roomData.Users[lastIdx]
	roomData.Users = roomData.Users[:lastIdx] // Remove last user

	// Update UserIdxMap
	roomData.UserIdxMap[roomData.Users[idx].UserID] = idx
	delete(roomData.UserIdxMap, userID)

	// Check if the room is empty
	if len(roomData.Users) == 0 {
		delete(rh.Rooms, roomID) // Remove room if empty
	}
}

func (rh *RoomHandler) CreateUser(userId, roomId, userName string, avatarId int) {
	// rh.mu.Lock()
	// defer rh.mu.Unlock()

	// roomData, exists := rh.Rooms[roomId]
	// newPosition := lib.Position{Row: 0, Col: 0} // Initial position if no players in the room

	// newUser := types.User{
	// 	UserName:    userName,
	// 	UserID:      userId,
	// 	RoomID:      roomId,
	// 	Position:    newPosition,
	// 	Avatar:      types.DefaultAvatars[avatarId], // Assume avatars is defined
	// 	AvatarXAxis: types.Right,                    // Replace with the actual value
	// }

	// if !exists {
	// 	// Room doesn't exist, create new RoomData
	// 	newRoomData := &RoomData{
	// 		Users:          []types.User{newUser},
	// 		UsersPositions: make(map[string]struct{}),
	// 		UserIdxMap:     make(map[string]int),
	// 	}

	// 	newRoomData.UserIdxMap[userId] = 0
	// 	newRoomData.UsersPositions[string(newPosition)] = struct{}{}

	// 	// Create chatbot on room init
	// 	chatbotPosition := rh.GetRandomPosition(newRoomData)
	// 	chatBot := types.User{
	// 		UserName:    config.ChatbotName,
	// 		UserID:      config.ChatbotName,
	// 		RoomID:      roomId,
	// 		Position:    lib.Position{Row: chatbotPosition[0], Col: chatbotPosition[1]},
	// 		Avatar:      types.DefaultAvatars[avatarId], // Ensure you have a chatbot avatar
	// 		AvatarXAxis: types.Right,
	// 	}

	// 	newRoomData.Users = append(newRoomData.Users, chatBot)
	// 	newRoomData.UserIdxMap[config.ChatbotName] = 1
	// 	newRoomData.UsersPositions[string(chatbotPosition)] = struct{}{}

	// 	// Store the new room data
	// 	rh.Rooms[roomId] = newRoomData

	// 	// Schedule a task for the chatbot
	// 	go func() {
	// 		ticker := time.NewTicker(time.Duration(rand.Intn(11)+10) * time.Second)
	// 		defer ticker.Stop()

	// 		for range ticker.C {
	// 			pos := rh.GetRandomPosition(newRoomData)
	// 			rh.UpdatePosition(lib.Position{Row: pos[0], Col: pos[1]}, roomId, config.ChatbotName)
	// 		}
	// 	}()
	// 	return
	// }

	// // Room exists, add the new user
	// newPosition = rh.GetRandomPosition(roomData)
	// newUser.Position = newPosition

	// roomData.Users = append(roomData.Users, newUser)
	// roomData.UserIdxMap[userId] = len(roomData.Users) - 1
	// roomData.UsersPositions[fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)] = struct{}{}

	// // Update the room data in the map
	// rh.Rooms[roomId] = roomData
}
