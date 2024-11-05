package controllers

import (
	"core/internal/db"
	"core/internal/db/models"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Signup(c *gin.Context) {
	// * 1. Get email, username and password from request body
	var reqBody struct {
		Email    string
		Username string
		Password string
	}

	if c.Bind(&reqBody) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid/missing parameters",
		})

		return
	}

	// * 2. Check if Email or Username is already stored
	var count int64
	db.DbCtx.Model(&models.User{}).Where("email = ?", reqBody.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email already exists.",
		})

		return
	}

	db.DbCtx.Model(&models.User{}).Where("username = ?", reqBody.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username already exists.",
		})

		return
	}

	// * 3. Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(reqBody.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to hash password.",
		})

		return
	}

	// * 4. Save user
	user := models.User{
		Email:    reqBody.Email,
		Username: reqBody.Username,
		Password: string(passwordHash),
	}

	saveResult := db.DbCtx.Create(&user)
	if saveResult.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to save user",
		})

		return
	}

	// * 5. Send a response
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
	})
}

func Login(c *gin.Context) {
	// * Get email and password from req
	var reqBody struct {
		Email    string
		Password string
	}

	if c.Bind(&reqBody) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid/missing parameters",
		})

		return
	}

	// * Verify password
	var user models.User
	db.DbCtx.First(&user, "email = ?", reqBody.Email)

	if user.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid Email and/or Password",
		})

		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(reqBody.Password))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid Email and/or Password",
		})

		return
	}

	// * Generate jwt access and refresh pair tokens
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Minute * 15).Unix(),
	})

	accessTokenString, err := accessToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to generate access/refresh token",
		})

		return
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to generate access/refresh token",
		})

		return
	}

	// * Send a response
	c.JSON(http.StatusOK, gin.H{
		"accessToken":  accessTokenString,
		"refreshToken": refreshTokenString,
	})
}

func Refresh(c *gin.Context) {
	userId, _ := c.Get("userId")

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userId,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(os.Getenv("JWT_SECRET")))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to generate access/refresh token",
		})

		return
	}

	// * Send a response
	c.JSON(http.StatusOK, gin.H{
		"accessToken": refreshTokenString,
	})
}

func Protected(c *gin.Context) {
	user, _ := c.Get("user")

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}
