package controllers

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

	// * 2. Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(reqBody.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Something went wrong trying to generate a hash for password: %s. Error: %s", reqBody.Password, err)
	}

	fmt.Println("Hash:", string(passwordHash))

	// * 3. Save user
	user := models.User{
		Email:    reqBody.Email,
		Username: reqBody.Username,
		Password: string(passwordHash),
	}

	saveResult := db.DbCtx.Create(&user)
	if saveResult.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Something went wrong trying to save user",
		})

		return
	}

	// * 4. Send a response
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
			"error": "Invalid email and/or password",
		})

		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(reqBody.Password))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email and/or password",
		})

		return
	}

	// * Generate jwt token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email and/or password",
		})

		return
	}

	// * Set authorization cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authorization", tokenString, 3600*24*30, "", "", false, true)

	// * Send a response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

func Protected(c *gin.Context) {
	user, _ := c.Get("user")

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}
