package main

import (
	"fmt"
	"log"
	"os"

	gin "github.com/gin-gonic/gin"
	godotenv "github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Something went left trying to load .env file: %s", err)
	}

	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong!!",
		})
	})

	port := ":" + os.Getenv("PORT")
	fmt.Println("🚀 ~ funcmain ~ port:", port)

	r.Run(port)
	fmt.Println("Serving on ", port)
}
