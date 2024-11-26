package util

import (
	"core/internal/lib"
	"core/types"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	mathRand "math/rand"
)

func Contains(target []string, value string) bool {
	for _, v := range target {
		if v == value {
			return true
		}
	}

	return false
}

func DeleteFromSlice(target []string, value string) []string {
	for idx, v := range target {
		if v == value {
			return append(target[:idx], target[idx+1:]...)
		}
	}

	return target
}

// Function to convert UsersPositions map to a slice of Position
func ConvertMapToSlice(usersPositions []string) []lib.Position {
	positions := []lib.Position{}

	for _, key := range usersPositions {
		var row, col int
		fmt.Sscanf(key, "%d,%d", &row, &col)
		positions = append(positions, lib.Position{Row: row, Col: col})
	}

	return positions
}

func GetRandomId() (string, error) {
	rId, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", fmt.Errorf("error generating random id: %v", err)
	}

	return rId.String(), nil
}

func NewRoomId(roomName string) (*types.RoomId, error) {
	randomId, err := GetRandomId()
	if err != nil {
		return nil, fmt.Errorf("error generating random id: %v", err)
	}

	id := fmt.Sprintf(types.RoomIdFormat, roomName, randomId)
	roomId := types.RoomId(id)

	return &roomId, nil
}

// ! movements are not perfect
func GetUserFacingDir(origin lib.Position, target lib.Position) types.FacingDirection {

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

func ParsePayload(data interface{}, dest interface{}) error {
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

// Get a random position in the room
func GetRandomEmptyPosition(occupiedPositions []string, max int) (string, lib.Position) {
	for {
		row := mathRand.Intn(max)
		col := mathRand.Intn(max)
		var strPos string = fmt.Sprintf("%d,%d", row, col)

		exists := Contains(
			occupiedPositions,
			strPos,
		)

		if !exists {
			return strPos, lib.Position{Row: row, Col: col}
		}
	}
}

func PositionToString(p lib.Position) string {
	return fmt.Sprintf("%d,%d", p.Row, p.Col)
}
