package lib

import (
	"math"
	"sort"
)

type Position struct {
	Row int
	Col int
}

type Cell struct {
	Row     int
	Col     int
	GCost   int
	HCost   int
	FCost   int
	Parent  *Cell
	Visited bool
}

func calculateManhattanDistance(row1, col1, row2, col2 int) int {
	return int(math.Abs(float64(row1-row2))) + int(math.Abs(float64(col1-col2)))
}

func isValidCell(row, col, numRows, numCols int, invalidPositions map[Position]struct{}) bool {
	if row < 0 || row >= numRows || col < 0 || col >= numCols {
		return false // Out of bounds
	}

	pos := Position{Row: row, Col: col}
	_, exists := invalidPositions[pos]
	return !exists
}

func getNeighbors(cell *Cell, cells [][]Cell, invalidPositions map[Position]struct{}) []*Cell {
	directions := []Position{
		{-1, 0},  // Top
		{1, 0},   // Bottom
		{0, -1},  // Left
		{0, 1},   // Right
		{-1, -1}, // Top-left
		{-1, 1},  // Top-right
		{1, -1},  // Bottom-left
		{1, 1},   // Bottom-right
	}

	neighbors := []*Cell{}
	for _, dir := range directions {
		newRow := cell.Row + dir.Row
		newCol := cell.Col + dir.Col

		if isValidCell(newRow, newCol, len(cells), len(cells[0]), invalidPositions) {
			neighbors = append(neighbors, &cells[newRow][newCol])
		}
	}

	return neighbors
}

func calculatePath(endCell *Cell) []Position {
	path := []Position{}
	currentCell := endCell

	for currentCell != nil {
		path = append([]Position{{currentCell.Row, currentCell.Col}}, path...)
		currentCell = currentCell.Parent
	}

	return path
}

func FindPath(startRow, startCol, endRow, endCol, gridSize int, invalidPositions []Position) []Position {
	numRows := gridSize
	numCols := gridSize

	// Create a 2D slice to store the Cell objects for each cell in the grid
	cells := make([][]Cell, numRows)
	for row := 0; row < numRows; row++ {
		cells[row] = make([]Cell, numCols)
		for col := 0; col < numCols; col++ {
			cells[row][col] = Cell{
				Row:     row,
				Col:     col,
				GCost:   math.MaxInt32,
				HCost:   calculateManhattanDistance(row, col, endRow, endCol),
				FCost:   0,
				Parent:  nil,
				Visited: false,
			}
		}
	}

	// Create a map for invalid positions
	invalidPosMap := make(map[Position]struct{})
	for _, pos := range invalidPositions {
		invalidPosMap[pos] = struct{}{}
	}

	// Perform A* search
	openList := []*Cell{&cells[startRow][startCol]}
	cells[startRow][startCol].GCost = 0
	cells[startRow][startCol].FCost = cells[startRow][startCol].HCost

	for len(openList) > 0 {
		// Sort the open list based on FCost
		sort.Slice(openList, func(i, j int) bool {
			return openList[i].FCost < openList[j].FCost
		})

		currentCell := openList[0]
		openList = openList[1:] // Remove the first cell

		currentCell.Visited = true

		if currentCell.Row == endRow && currentCell.Col == endCol {
			return calculatePath(currentCell) // Destination reached, return the path
		}

		neighbors := getNeighbors(currentCell, cells, invalidPosMap)

		for _, neighbor := range neighbors {
			if neighbor.Visited {
				continue // Skip visited neighbors
			}

			newGCost := currentCell.GCost + 1

			if newGCost < neighbor.GCost {
				neighbor.GCost = newGCost
				neighbor.FCost = neighbor.GCost + neighbor.HCost
				neighbor.Parent = currentCell

				// If neighbor is not in openList, add it
				found := false
				for _, n := range openList {
					if n == neighbor {
						found = true
						break
					}
				}
				if !found {
					openList = append(openList, neighbor)
				}
			}
		}
	}

	return nil // No path found
}
