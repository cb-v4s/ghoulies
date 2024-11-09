package routes

import (
	"core/internal/middleware"
	"core/internal/server/controllers"

	"core/internal/ws"

	docs "core/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRoutes(r *gin.Engine) {
	docs.SwaggerInfo.Title = "my api title"
	docs.SwaggerInfo.Description = "my description"
	docs.SwaggerInfo.Version = "1.0"

	apiv1 := r.Group("/api/v1")
	{
		userGroup := apiv1.Group("/user")
		{
			userGroup.POST("/signup", controllers.Signup)
			userGroup.POST("/login", controllers.Login)
			userGroup.GET("/refresh", middleware.Authenticate, controllers.Refresh)
			userGroup.GET("/protected", middleware.Authenticate, controllers.Protected) // this is a test ep
		}

		roomGroup := apiv1.Group("/rooms")
		{
			roomGroup.GET("", controllers.GetRooms)
		}

	}

	r.GET("/ws", ws.HandleWebSocket)
	r.POST("/ws", ws.HandleWebSocket)
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
