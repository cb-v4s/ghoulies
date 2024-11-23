package main

import (
	"core/config"
	db "core/internal/database"
	"core/internal/memory"
	"core/internal/routes"
	"fmt"
	"log"
	"strings"

	"github.com/gin-contrib/cors"
	gin "github.com/gin-gonic/gin"

	godotenv "github.com/joho/godotenv"
)

type UserData struct {
	RoomName string `json:"roomName"`
	UserName string `json:"userName"`
	AvatarId int    `json:"avatarId"`
}

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Something went wrong trying to load .env file: %s", err)
	}

	fmt.Printf("App mode: %s\n", config.GinMode)

	db.New()
	memory.New()

	gin.SetMode(config.GinMode)
	r := gin.New()

	// TODO: mover toda la conf de cors, creacion de servidor a otro lugar
	corsCfg := cors.DefaultConfig()

	if config.GinMode == gin.DebugMode {
		corsCfg.AllowOrigins = []string{"*"}
	} else {
		allowedOrigins := strings.Split(config.AllowOrigins, ",")

		for _, origin := range allowedOrigins {
			fmt.Printf("Allowed origin: %s\n", origin)
		}

		corsCfg.AllowOrigins = allowedOrigins
	}

	corsCfg.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Content-Security-Policy", "Access-Control-Allow-Origin"}
	corsCfg.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsCfg.AllowCredentials = true

	r.Use(cors.New(corsCfg))

	routes.SetupRoutes(r)

	if err := r.Run(":" + config.PORT); err != nil {
		log.Fatal("Failed to serve", err)
		return
	}
}
