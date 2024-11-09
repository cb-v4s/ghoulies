package controllers

import (
	"core/internal/memory"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PopularRoomList struct {
	RoomId     string `json:"roomId"`
	RoomName   string `json:"roomName"`
	TotalConns int    `json:"totalConns"`
}

// GetRooms
// @Summary      Retrieve popular websocket rooms
//
//	@Description  Get popular rooms
//	@Tags         rooms
//
// @Success      200  {object}  []types.PopularRoomList
// @Failure      500  {object}  map[string]any
// @Router /api/v1/rooms [get]
func GetRooms(c *gin.Context) {
	// TODO: mover logica a room service
	rooms, err := memory.GetPopularRooms()
	if err != nil {
		fmt.Printf("error from GetRooms service: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{})
		return
	}

	fmt.Printf("failed to get rooms: %v", rooms)

	c.JSON(http.StatusOK, gin.H{
		"rooms": rooms,
	})
}
