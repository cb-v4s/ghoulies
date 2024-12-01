package config

import (
	"fmt"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupCors() gin.HandlerFunc {
	corsCfg := cors.DefaultConfig()

	if GinMode == gin.DebugMode {
		corsCfg.AllowOrigins = []string{"*"}
	} else {
		allowedOrigins := strings.Split(AllowOrigins, ",")

		for _, origin := range allowedOrigins {
			fmt.Printf("Allowed origin: %s\n", origin)
		}

		corsCfg.AllowOrigins = allowedOrigins
	}

	corsCfg.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Content-Security-Policy", "Access-Control-Allow-Origin"}
	corsCfg.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsCfg.AllowCredentials = true

	return cors.New(corsCfg)
}
