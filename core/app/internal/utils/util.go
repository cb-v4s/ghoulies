package util

import (
	"bufio"
	types "core/types"
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"sync"
)

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

func ReadFileLines(src string, callback func(string)) error {
	file, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open file source: %s", src)
	}

	defer file.Close()

	scanner := bufio.NewScanner(file)
	var wg sync.WaitGroup
	lineChannel := make(chan string)

	go func() {
		for line := range lineChannel {
			callback(line)
			wg.Done()
		}
	}()

	for scanner.Scan() {
		wg.Add(1)
		lineChannel <- scanner.Text()
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	close(lineChannel)

	wg.Wait()
	return nil
}
