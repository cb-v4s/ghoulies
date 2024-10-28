package middleware

import (
	"core/internal/db"
	"core/internal/db/models"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Authenticate(c *gin.Context) {
	tokenString, err := c.Cookie("Authorization")
	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(os.Getenv("JWT_SECRET")), nil
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
		c.Set("user", map[string]string{
			"username": user.Username,
			"email":    user.Email,
		})

		c.Next()
	} else {
		c.AbortWithStatus(http.StatusUnauthorized)
	}
}
