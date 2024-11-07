package middleware

import (
	"core/config"
	db "core/internal/database"
	"core/internal/database/models"
	"fmt"
	"log"
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
		log.Fatal(err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		// * Validate token expiration
		var userID = claims["sub"].(float64)
		var currentTime = float64(time.Now().Unix())
		var expDate = claims["exp"].(float64)

		if currentTime > expDate {
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		// * Find user
		var user models.User
		db.DbCtx.First(&user, userID)

		if user.ID == 0 {
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		// * Attach user data to cookie
		c.Set("userId", user.ID)

		c.Next()
	} else {
		c.AbortWithStatus(http.StatusUnauthorized)
	}
}
