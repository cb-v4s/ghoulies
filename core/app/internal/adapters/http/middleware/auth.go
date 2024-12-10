package middleware

import (
	"core/internal/core"
	repositories "core/internal/ports"
	"fmt"
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
	tokenString, _ := c.Cookie(core.CookieRefreshToken)
	fmt.Println("cookie access token:", tokenString)

	userData, err := core.DecodeToken(tokenString)
	if err != nil {
		fmt.Println("decode token error:", err)
		c.Status(http.StatusUnauthorized)
		return
	}

	fmt.Println("userData:", userData)

	user, err := ctx.userRepo.GetById(userData.Sub)
	if err != nil {
		fmt.Println("get by id error:", err)
		c.Status(http.StatusUnauthorized)
		return
	}

	fmt.Println("user:", user)

	c.Set("user", user)
	c.Next()
}
