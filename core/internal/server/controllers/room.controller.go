package controllers

import (
	"core/internal/ws"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RoomsInfo struct {
	Title      string `json:"title"`
	TotalConns int    `json:"totalConns"`
}

func GetRooms(c *gin.Context) {
	rooms := []RoomsInfo{}
	var roomsLimit int = 10

	for roomId, roomData := range ws.RoomHandler.Rooms {
		if len(rooms) >= roomsLimit {
			break
		}

		rooms = append(rooms, RoomsInfo{
			Title:      roomId,
			TotalConns: len(roomData.Users),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"rooms": rooms,
	})
}
