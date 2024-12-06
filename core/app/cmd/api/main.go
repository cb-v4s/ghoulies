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
	"core/types"
	"fmt"
	"log"

	gin "github.com/gin-gonic/gin"

	godotenv "github.com/joho/godotenv"
)

func main() {
	// * initialize environment variables
	if err := godotenv.Load(".env"); err != nil {
		log.Fatalf("Failed to load .env file: %v", err)
	}

	// * initialize database
	db, err := db.New()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v\n", err)
		return
	}

	// * initialize redis
	if err := memory.New(); err != nil {
		log.Fatalf("Failed to initialize redis: %v\n", err)
		return
	}

	// * initialize ports/repositories
	repos, err := ports.InitializeRepositories(db)
	if err != nil {
		log.Fatalf("Failed to initialize dependencies")
	}

	// * initialize services
	userService := services.NewUserService(&repos.User)
	// ... add more

	// * initialize controllers
	userController := controllers.NewUserController(userService)
	// ... add more

	// controllers := types.Controllers{User: userController, Room: roomController}

	// * initialize middlewares
	middlewares := types.Middlewares{
		Auth: middleware.NewAuthMiddleware(&repos.User).Authenticate,
		CSRF: middleware.ValidateCSRFToken(),
	}

	gin.SetMode(config.GinMode)
	server := gin.New()
	globalMiddlewares := []gin.HandlerFunc{
		config.SetupCors(),
	}

	server.Use(globalMiddlewares...)
	routes.SetupRoutes(server, userController, middlewares)

	if err := server.Run(":" + config.PORT); err != nil {
		log.Fatal("Failed to serve", err)
		return
	}

	fmt.Printf("Server mode: %s\n", config.GinMode)
}
