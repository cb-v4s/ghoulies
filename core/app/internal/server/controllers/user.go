package controllers

import (
	"core/config"
	db "core/internal/database"
	"core/internal/database/models"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	BcryptCharacterLimit = 72
)

type SignupSuccessResponse struct {
	Success bool `json:"success" example:"true"`
}

type SignupErrorResponse struct {
	Error string `json:"error" example:"Invalid/missing parameters"`
}

type SignupRequestBody struct {
	Email    string `json:"email" example:"alice@wonderland.tld"`
	Username string `json:"username" example:"Alice"`
	Password string `json:"password" example:"+5tRonG_P455w0rd_"`
}

type LoginRequestBody struct {
	Email    string `json:"email" binding:"required,email" example:"alice@wonderland.tld"`
	Password string `json:"password" binding:"required,max=72" example:"+5tRonG_P455w0rd_"`
}

type LoginSuccessResponse struct {
	AccessToken  string `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string `json:"refreshToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

type LoginErrorResponse struct {
	Error string `json:"error" example:"Invalid Email and/or Password"`
}

type RefreshTokenSuccessResponse struct {
	AccessToken string `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp915J9..."`
}

type RefreshTokenErrorResponse struct {
	Error string `json:"error" example:"something went wrong"`
}

// User Signup
// @Summary      Create a user account
//
//	@Tags         user
//
// @Param        body  body  SignupRequestBody  true  "User signup information"
// @Success      201  {object}  SignupSuccessResponse "Success response"
// @Failure      400  {object}  SignupErrorResponse "Failed response"
// @Router /api/v1/user/signup [post]
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

	if len(reqBody.Password) > BcryptCharacterLimit {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password must be no longer than 72 characters.",
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

// User Login
// @Summary    Login with credentials
//
//	@Description  Retrieves access and refresh tokens
//	@Tags         user
//
// @Param        body  body  LoginRequestBody  true  "User login information"
// @Success      200  {object}  LoginSuccessResponse "Success response"
// @Failure      400  {object}  LoginErrorResponse "Failed response"
// @Router /api/v1/user/login [post]
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

	accessTokenString, err := accessToken.SignedString([]byte(config.JwtSecret))
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

	refreshTokenString, err := refreshToken.SignedString([]byte(config.JwtSecret))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to generate access/refresh token",
		})

		return
	}

	// * Send a response
	c.JSON(http.StatusOK, LoginSuccessResponse{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
	})
}

// Refresh Token
// @Summary Get a new access token
//
//	@Tags         user
//
// @Param        Authorization header  string  true  "Access token"  example("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
// @Success      200  {object}  RefreshTokenSuccessResponse "Success response"
// @Failure      400  {object}  RefreshTokenErrorResponse "Failed response"
// @Router /api/v1/user/refresh  [get]
func Refresh(c *gin.Context) {
	user, _ := c.Get("user") // * esto va a venir del middleware
	var userData models.User = user.(models.User)

	fmt.Printf("User: %v. Abajo deberia dar error\n", user)

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userData.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(config.JwtSecret))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to generate access/refresh token",
		})

		return
	}

	c.JSON(http.StatusOK, RefreshTokenSuccessResponse{
		AccessToken: refreshTokenString,
	})
}

// Protected Route
// @Summary Example protected route
//
//	@Tags         user
//
// @Param        Authorization header  string  true  "Access token"  example("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
// @Success      200  {object}  any "Success response"
// @Failure      400  {object}  any "Failed response"
// @Router /api/v1/user/protected  [get]
func Protected(c *gin.Context) {
	// * esto se va a setear desde authentication middleware
	user, exists := c.Get("user")
	if exists {
		c.JSON(http.StatusOK, gin.H{
			"user": user,
		})
	} else {
		c.Status(http.StatusUnauthorized)
	}
}
