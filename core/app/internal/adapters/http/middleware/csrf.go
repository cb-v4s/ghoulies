package middleware

import (
	"core/types"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

var (
	ErrorTokenMismatch = errors.New("csrf tokens mismatch")
)

const (
	CSRFCookieKey = "_csrf"
	CSRFHeaderKey = "X-Csrf-Token"
)

func GetCSRFToken() (*string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}

	token := base64.StdEncoding.EncodeToString(b)

	return &token, nil
}

func ValidateCSRFToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenHeader := c.GetHeader(CSRFHeaderKey)
		decodedTokenHeader, err := url.QueryUnescape(tokenHeader)
		if err != nil {
			c.JSON(http.StatusForbidden, types.ApiError(ErrorTokenMismatch))
			c.Abort()
			return
		}

		tokenCookie, err := c.Cookie(CSRFCookieKey)

		if err != nil || tokenCookie != decodedTokenHeader {
			c.JSON(http.StatusForbidden, types.ApiError(ErrorTokenMismatch))
			c.Abort()

			return
		}

		c.Next()
	}
}
