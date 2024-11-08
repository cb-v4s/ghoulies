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

func GetRooms(c *gin.Context) {
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
