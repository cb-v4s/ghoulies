package middleware

import (
	"core/config"
	db "core/internal/database"
	"core/internal/database/models"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Authenticate(c *gin.Context) {
	tokenString := c.Request.Header.Get("Authorization")

	if tokenString == "" {
		c.AbortWithStatus(http.StatusUnauthorized)
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(config.JwtSecret), nil
	})

	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		// * Validate token expiration
		var userData = claims["sub"].(float64)
		var currentTime = float64(time.Now().Unix())
		var expDate = claims["exp"].(float64)

		if currentTime > expDate {
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		// * Find user
		var user models.User
		result := db.DbCtx.Select("id, username, email").First(&user, userData)
		if result.Error != nil {
			fmt.Printf("Failed to get user from database")
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		if user.ID == 0 {
			fmt.Printf("Failed to get user from database")
			c.Status(http.StatusUnauthorized)
		}

		// * Attach user data to cookie
		c.Set("user", user)

		c.Next()
	} else {
		c.AbortWithStatus(http.StatusUnauthorized)
	}
}
