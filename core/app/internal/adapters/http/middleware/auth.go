package middleware

import (
	"core/internal/core"
	repositories "core/internal/ports"
	"net/http"

	"github.com/gin-gonic/gin"
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
	tokenString, _ := c.Cookie(core.CookieAccessToken)

	userData, err := core.DecodeToken(tokenString)
	if err != nil {
		c.Status(http.StatusUnauthorized)
		return
	}

	user, err := ctx.userRepo.GetById(userData.Sub)
	if err != nil {
		c.Status(http.StatusUnauthorized)
		return
	}

	c.Set("user", user)
	c.Next()
}
