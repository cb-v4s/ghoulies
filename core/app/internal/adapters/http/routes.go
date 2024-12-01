package routes

import (
	"core/internal/adapters/http/controllers"
	"core/internal/adapters/ws"

	"github.com/gin-gonic/gin"

	docs "core/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRoutes(r *gin.Engine, userController *controllers.UserController, authMiddleware gin.HandlerFunc) {
	// WebSocket API
	r.GET("/ws", ws.HandleWebSocket)
	r.POST("/ws", ws.HandleWebSocket)

	// REST API
	apiv1 := r.Group("/api/v1")
	{
		userGroup := apiv1.Group("/user")
		{
			userGroup.POST("/signup", userController.Signup)
			userGroup.POST("/login", userController.Login)
			userGroup.GET("/refresh", authMiddleware, userController.Refresh)
			userGroup.GET("/protected", authMiddleware, controllers.Protected) // ! testing ep
		}

		roomGroup := apiv1.Group("/rooms")
		{
			roomGroup.GET("", controllers.GetRooms)
		}
	}

	// DOCS
	docs.SwaggerInfo.Title = "Ghosties"
	docs.SwaggerInfo.Description = "REST API Documentation"
	docs.SwaggerInfo.Version = "1.0"

	r.Static("/wsdocs", "./wsdocs")
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
