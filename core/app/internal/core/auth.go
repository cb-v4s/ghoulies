package core

import (
	"core/config"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	RefreshTokenExpTime = time.Hour * 24
	AccessTokenExpTime  = time.Minute * 15
	CookieAccessToken   = "accessToken"
	CookieRefreshToken  = "refreshToken"
)

var (
	ErrorFailedAccessTokenGen = errors.New("failed to generate tokens pair")
	ErrorInvalidToken         = errors.New("invalid token")
	ErrorTokenHasExpired      = errors.New("token has expired")

	JwtEncAlgorithm = jwt.SigningMethodHS256
)

type JwtPayload struct {
	Sub      float64 // User id
	Username string
	Exp      float64 // Exp timestamp
}

type AuthTokensResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type UserAuth interface {
	GetTokensPair(userId float64, username string) (*AuthTokensResponse, error)
	DecodeToken(tokenString string) (*JwtPayload, error)
	GetRefreshToken(userId float64)
}

func GetTokensPair(userId uint, username string) (*AuthTokensResponse, error) {
	accessTokenStr, err := GenerateToken(userId, username, "access")
	if err != nil {
		return nil, ErrorFailedAccessTokenGen
	}

	refreshTokenStr, err := GenerateToken(userId, username, "refresh")
	if err != nil {
		return nil, ErrorFailedAccessTokenGen
	}

	return &AuthTokensResponse{
		AccessToken:  *accessTokenStr,
		RefreshToken: *refreshTokenStr,
	}, nil
}

func DecodeToken(tokenString string) (*JwtPayload, error) {

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(config.JwtSecret), nil
	})

	if err != nil {
		return nil, ErrorInvalidToken
	}

	var payload *JwtPayload

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		// * Validate token expiration

		username := claims["username"].(string)
		sub := claims["sub"].(float64)
		exp := claims["exp"].(float64)
		currentTime := float64(time.Now().Unix())

		if currentTime > exp {
			return nil, ErrorTokenHasExpired
		}

		payload = &JwtPayload{
			Sub:      sub,
			Username: username,
			Exp:      exp,
		}
	}

	return payload, nil
}

func GenerateToken(userId uint, username string, tokenType string) (*string, error) {
	var claims jwt.MapClaims
	if tokenType == "refresh" {
		claims = jwt.MapClaims{
			"sub":      userId,
			"username": username,
			"exp":      time.Now().Add(RefreshTokenExpTime).Unix(),
		}
	} else if tokenType == "access" {
		claims = jwt.MapClaims{
			"sub":      userId,
			"username": username,
			"exp":      time.Now().Add(AccessTokenExpTime).Unix(),
		}
	}

	refreshToken := jwt.NewWithClaims(JwtEncAlgorithm, claims)
	refreshTokenString, err := refreshToken.SignedString([]byte(config.JwtSecret))
	if err != nil {
		return nil, err
	}

	return &refreshTokenString, nil
}
