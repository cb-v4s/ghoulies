package main

import (
	"core/internal/db"
	"core/routes"
	"fmt"
	"log"
	"os"

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

	db.InitDb()
	gin.SetMode(os.Getenv("GIN_MODE"))
	r := gin.New()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{os.Getenv("UI_ORIGIN")}
	config.AllowOrigins = []string{"*"}

	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Content-Security-Policy", "Access-Control-Allow-Origin"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowCredentials = true

	r.Use(cors.New(config))

	routes.SetupRoutes(r)

	port := os.Getenv("PORT")

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to serve", err)
		return
	}

	fmt.Println("Serving on ", port)
}
