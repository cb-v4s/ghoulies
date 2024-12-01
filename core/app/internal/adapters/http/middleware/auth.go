package middleware

import (
	"core/config"
	repositories "core/internal/ports"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
	userRepo *repositories.UserRepoContext
}

func NewAuthMiddleware(userRepo *repositories.UserRepoContext) *AuthMiddleware {
	return &AuthMiddleware{
		userRepo: userRepo,
	}
}

func (ctx *AuthMiddleware) Authenticate(c *gin.Context) {
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		c.Abort()
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		// * Validate token expiration
		var userId = claims["sub"].(float64)
		var currentTime = float64(time.Now().Unix())
		var expDate = claims["exp"].(float64)

		if currentTime > expDate {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token has expired"})
			c.Abort()
			return
		}

		// * Find user
		user, err := ctx.userRepo.GetById(userId)
		if err != nil {
			fmt.Printf("Failed to get user from database for userId: %v\n", userId)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// * Attach user data to cookie
		c.Set("user", user)

		c.Next()
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		c.Abort()
	}
}
