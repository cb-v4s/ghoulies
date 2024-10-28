package main

import (
	"core/internal/db"
	"core/internal/middleware"
	"core/internal/server/controllers"
	"fmt"
	"log"
	"os"

	cors "github.com/gin-contrib/cors"
	gin "github.com/gin-gonic/gin"
	godotenv "github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Something went wrong trying to load .env file: %s", err)
	}

	db.InitDb()

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{os.Getenv("UI_ORIGIN")}
	config.AllowCredentials = true

	r.Use(cors.New(config))

	r.POST("/api/user/signup", controllers.Signup)
	r.POST("/api/user/login", controllers.Login)
	r.GET("/api/user/refresh", middleware.Authenticate, controllers.Refresh)
	r.GET("/api/user/protected", middleware.Authenticate, controllers.Protected)

	port := ":" + os.Getenv("PORT")

	r.Run(port)
	fmt.Println("Serving on ", port)
}
