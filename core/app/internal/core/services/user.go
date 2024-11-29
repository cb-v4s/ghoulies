package services

import (
	"core/config"
	db "core/internal/adapters/database"
	"core/internal/adapters/database/models"
	"core/types"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	BcryptCharacterLimit = 72
)

func Login(email string, password string) (int, types.ApiResponse) {
	// * Verify password
	var user models.User
	db.DbCtx.First(&user, "email = ?", email)

	if user.ID == 0 {
		return http.StatusBadRequest, types.ApiError("Invalid Email and/or Password")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return http.StatusBadRequest, types.ApiError("Invalid Email and/or Password")
	}

	// * Generate jwt access and refresh pair tokens
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Minute * 15).Unix(),
	})

	accessTokenString, err := accessToken.SignedString([]byte(config.JwtSecret))
	if err != nil {
		return http.StatusBadRequest, types.ApiError("Failed to generate access/refresh token")
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(config.JwtSecret))
	if err != nil {
		return http.StatusBadRequest, types.ApiError("Failed to generate access/refresh token")
	}

	// * Send a response
	return http.StatusOK, types.ApiResponse{
		"accessToken":  accessTokenString,
		"refreshToken": refreshTokenString,
	}
}

func Signup(email string, username string, password string) (int, types.ApiResponse) {
	if len(password) > BcryptCharacterLimit {
		return http.StatusBadRequest, types.ApiError("Password must be no longer than 72 characters.")
	}

	// * 2. Check if Email or Username is already stored
	var count int64
	db.DbCtx.Model(&models.User{}).Where("email = ?", email).Count(&count)
	if count > 0 {
		return http.StatusBadRequest, types.ApiError("Email already exists.")
	}

	db.DbCtx.Model(&models.User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return http.StatusBadRequest, types.ApiError("Username already exists.")
	}

	// * 3. Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return http.StatusBadRequest, types.ApiError("Failed to hash password.")
	}

	// * 4. Save user
	user := models.User{
		Email:    email,
		Username: username,
		Password: string(passwordHash),
	}

	saveResult := db.DbCtx.Create(&user)
	if saveResult.Error != nil {
		return http.StatusBadRequest, types.ApiError("Failed to save user")
	}

	// * 5. Send a response
	return http.StatusCreated, types.ApiResponse{
		"success": true,
	}
}

func RefreshToken(user models.User) (int, types.ApiResponse) {
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(config.JwtSecret))

	if err != nil {
		return http.StatusBadRequest, types.ApiError("Failed to generate access/refresh token")
	}

	return http.StatusOK, types.ApiResponse{"accessToken": refreshTokenString}
}
