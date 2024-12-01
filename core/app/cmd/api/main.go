package main

import (
	"core/config"
	db "core/internal/adapters/database"
	routes "core/internal/adapters/http"
	"core/internal/adapters/http/controllers"
	"core/internal/adapters/http/middleware"
	"core/internal/adapters/memory"
	"core/internal/core/services"
	ports "core/internal/ports"
	"fmt"
	"log"

	gin "github.com/gin-gonic/gin"

	godotenv "github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Fatalf("Failed to load .env file: %v", err)
	}

	db, err := db.New()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v\n", err)
		return
	}

	if err := memory.New(); err != nil {
		log.Fatalf("Failed to initialize redis: %v\n", err)
		return
	}

	gin.SetMode(config.GinMode)
	server := gin.New()
	globalMiddlewares := []gin.HandlerFunc{
		config.SetupCors(),
	}

	// * initialize ports/repositories
	repos, err := ports.InitializeRepositories(db)
	if err != nil {
		log.Fatalf("Failed to initialize dependencies")
	}

	// * initialize services
	userService := services.NewUserService(&repos.User)

	// * initialize controllers
	userController := controllers.NewUserController(userService)

	// * initialize middlewares
	authMiddleware := middleware.NewAuthMiddleware(&repos.User)

	server.Use(globalMiddlewares...)
	routes.SetupRoutes(server, userController, authMiddleware.Authenticate)

	if err := server.Run(":" + config.PORT); err != nil {
		log.Fatal("Failed to serve", err)
		return
	}

	fmt.Printf("Server mode: %s\n", config.GinMode)
}
