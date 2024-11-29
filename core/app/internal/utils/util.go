package util

import (
	"core/types"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
)

// Function to convert UsersPositions map to a slice of Position
func ConvertMapToSlice(usersPositions []string) []types.Position {
	positions := []types.Position{}

	for _, key := range usersPositions {
		var row, col int
		fmt.Sscanf(key, "%d,%d", &row, &col)
		positions = append(positions, types.Position{Row: row, Col: col})
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
