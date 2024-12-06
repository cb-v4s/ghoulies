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
		corsCfg.AllowOrigins = []string{"http://localhost:3000", "http://localhost:3001"} // TODO:
	} else {
		allowedOrigins := strings.Split(AllowOrigins, ",")

		for _, origin := range allowedOrigins {
			fmt.Printf("Allowed origin: %s\n", origin)
		}

		corsCfg.AllowOrigins = allowedOrigins
	}

	corsCfg.AllowHeaders = []string{"Origin", "Content-Type", "X-Requested-With", "Content-Security-Policy", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers", "X-CSRF-Token"}
	corsCfg.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE", "HEAD"}
	corsCfg.AllowCredentials = true // * allow cookies

	return cors.New(corsCfg)
}
