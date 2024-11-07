package routes

import (
	"core/internal/middleware"
	"core/internal/server/controllers"

	"core/internal/ws"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
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
}
