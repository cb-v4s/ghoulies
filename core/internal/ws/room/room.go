package room

import (
	"core/internal/lib"
	"core/types"
	"core/util"
	"fmt"
	"sync"

	"golang.org/x/exp/rand"
)

const (
	SpeedUserMov = 220
	GridSize     = 10
	RoomLimit    = 10
)

type RoomHandler struct {
	Rooms map[string]*RoomData
	mu    sync.Mutex // Mutex to protect access to Rooms
}

type Position struct {
	Row int
	Col int
}

type UserID string
type UserIdx int

type RoomData struct {
	Users          []types.User
	UsersPositions []string // * e.g. "Row, Col" => "1,2", "3,4", ...
	UserIdxMap     map[UserID]UserIdx
}

// Check if the room is full
func (rh *RoomHandler) IsRoomFull(roomID string) bool {
	rh.mu.Lock()
	defer rh.mu.Unlock()
	roomData, exists := rh.Rooms[roomID]
	return exists && len(roomData.Users) >= RoomLimit
}

// Get the user index in the specified room
func (rh *RoomHandler) GetUserIdx(userID UserID, roomID string) UserIdx {
	rh.mu.Lock()
	defer rh.mu.Unlock()
	if roomData, exists := rh.Rooms[roomID]; exists {
		return roomData.UserIdxMap[userID]
	}
	return -1 // Return -1 if user not found
}

// Get a random position in the room
func (rh *RoomHandler) GetRandomEmptyPosition(occPositions []string) (string, lib.Position) {
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

// func (rh *RoomHandler) UpdatePosition(dest lib.Position, roomID string, userID UserID /*, io *Server*/) {
// 	rh.mu.Lock()
// 	roomData, exists := rh.Rooms[roomID]
// 	rh.mu.Unlock()

// 	if !exists {
// 		return
// 	}

// 	idx := rh.GetUserIdx(userID, roomID)
// 	if idx == -1 {
// 		return // User not found
// 	}

// 	currentPos := roomData.Users[idx].Position
// 	posKey := fmt.Sprintf("%d,%d", currentPos.Row, currentPos.Col)

// 	// Remove current position from UsersPositions
// 	util.Delete(roomData.UsersPositions, posKey)

// 	invalidPositions := roomData.UsersPositions

// 	// Find path to the destination (implement findPath)
// 	path := lib.FindPath(currentPos.Row, currentPos.Col, dest.Row, dest.Col, GridSize, invalidPositions)

// 	if len(path) == 0 {
// 		return // No valid path
// 	}

// 	// * Move the user along the path (this can be implemented as a goroutine for async movement)
// 	go func() {
// 		for _, newPosition := range path {
// 			roomData.Users[idx].Position = newPosition
// 			newPosKey := fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)
// 			roomData.UsersPositions[newPosKey] = struct{}{}

// 			// TODO: uncomment
// 			// io.To(roomID).Emit("updateMap", roomData.Users)

// 			time.Sleep(time.Duration(SpeedUserMov) * time.Millisecond) // Simulate movement delay
// 		}
// 	}()
// }

// func (rh *RoomHandler) RemoveUser(userID string, roomID string) {
// 	rh.mu.Lock()
// 	defer rh.mu.Unlock()

// 	roomData, exists := rh.Rooms[roomID]
// 	if !exists {
// 		return
// 	}

// 	idx, exists := roomData.UserIdxMap[userID]
// 	if !exists {
// 		return // User not found
// 	}

// 	// Remove position from UsersPositions
// 	pos := roomData.Users[idx].Position
// 	posKey := fmt.Sprintf("%d,%d", pos.Row, pos.Col)
// 	delete(roomData.UsersPositions, posKey)

// 	// Replace the user with the last user for O(1) removal
// 	lastIdx := len(roomData.Users) - 1
// 	roomData.Users[idx] = roomData.Users[lastIdx]
// 	roomData.Users = roomData.Users[:lastIdx] // Remove last user

// 	// Update UserIdxMap
// 	roomData.UserIdxMap[roomData.Users[idx].UserID] = idx
// 	delete(roomData.UserIdxMap, userID)

// 	// Check if the room is empty
// 	if len(roomData.Users) == 0 {
// 		delete(rh.Rooms, roomID) // Remove room if empty
// 	}
// }

func PositionToString(p lib.Position) string {
	return fmt.Sprintf("%d,%d", p.Row, p.Col)
}

// func (rh *RoomHandler) CreateUser(userId, roomId, userName string, avatarId int) {
// 	rh.mu.Lock()
// 	defer rh.mu.Unlock()

// 	roomData, exists := rh.Rooms[roomId]
// 	newPosition := lib.Position{Row: 0, Col: 0} // Initial position if no players in the room

// 	newUser := types.User{
// 		UserName:    userName,
// 		UserID:      userId,
// 		RoomID:      roomId,
// 		Position:    newPosition,
// 		Avatar:      types.DefaultAvatars[avatarId], // Assume avatars is defined
// 		AvatarXAxis: types.Right,                    // Replace with the actual value
// 	}

// 	if !exists {
// 		// Room doesn't exist, create new RoomData
// 		newRoomData := &RoomData{
// 			Users:          []types.User{newUser},
// 			UsersPositions: []string{},
// 			UserIdxMap:     make(map[string]int),
// 		}

// 		newRoomData.UserIdxMap[userId] = 0
// 		newRoomData.UsersPositions[positionToString(newPosition)] = struct{}{}

// 		// Create chatbot on room init
// 		row, col := rh.GetRandomPosition(newRoomData)
// 		chatBot := types.User{
// 			UserName:    config.ChatbotName,
// 			UserID:      config.ChatbotName,
// 			RoomID:      roomId,
// 			Position:    lib.Position{Row: row, Col: col},
// 			Avatar:      types.DefaultAvatars[avatarId], // Ensure you have a chatbot avatar
// 			AvatarXAxis: types.Right,
// 		}

// 		newRoomData.Users = append(newRoomData.Users, chatBot)
// 		newRoomData.UserIdxMap[config.ChatbotName] = 1

// 		// TODO: watch this
// 		// newRoomData.UsersPositions[] = struct{}{}

// 		// Store the new room data
// 		rh.Rooms[roomId] = newRoomData

// 		// Schedule a task for the chatbot
// 		go func() {
// 			ticker := time.NewTicker(time.Duration(rand.Intn(11)+10) * time.Second)
// 			defer ticker.Stop()

// 			for range ticker.C {
// 				row, col := rh.GetRandomPosition(newRoomData)
// 				rh.UpdatePosition(lib.Position{Row: row, Col: col}, roomId, config.ChatbotName)
// 			}
// 		}()
// 		return
// 	}

// 	// Room exists, add the new user
// 	row, col := rh.GetRandomPosition(roomData)
// 	newUser.Position = lib.Position{
// 		Row: row,
// 		Col: col,
// 	}

// 	roomData.Users = append(roomData.Users, newUser)
// 	roomData.UserIdxMap[userId] = len(roomData.Users) - 1
// 	roomData.UsersPositions[fmt.Sprintf("%d,%d", newPosition.Row, newPosition.Col)] = struct{}{}

// 	// Update the room data in the map
// 	rh.Rooms[roomId] = roomData
// }
