package main

import (
	"core/internal/db"
	"core/routes"
	"fmt"
	"log"
	"os"

	cors "github.com/gin-contrib/cors"
	gin "github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
	godotenv "github.com/joho/godotenv"
)

var wsServer *socketio.Server

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Something went wrong trying to load .env file: %s", err)
	}

	db.InitDb()

	r := gin.Default()
	wsServer = socketio.NewServer(nil)

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{os.Getenv("UI_ORIGIN")}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Content-Security-Policy"}
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
