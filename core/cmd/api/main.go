package main

import (
	"core/internal/db"
	"core/internal/middleware"
	"core/internal/server/controllers"
	"fmt"
	"log"
	"os"

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

	r.POST("/user/signup", controllers.Signup)
	r.POST("/user/login", controllers.Login)
	r.GET("/user/protected", middleware.Authenticate, controllers.Protected)

	port := ":" + os.Getenv("PORT")

	r.Run(port)
	fmt.Println("Serving on ", port)
}
