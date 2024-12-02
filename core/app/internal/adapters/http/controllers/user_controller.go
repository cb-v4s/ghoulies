package controllers

import (
	"core/internal/adapters/database/models"
	"core/internal/core/services"
	"core/types"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	User *services.UserService
	// ... add more if needed
}

func NewUserController(userService *services.UserService) *UserController {
	return &UserController{
		User: userService,
	}
}

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
func (services *UserController) Signup(c *gin.Context) {
	// * 1. Get email, username and password from request body
	var reqBody struct {
		Email    string
		Username string
		Password string
	}

	if c.Bind(&reqBody) != nil {
		c.JSON(http.StatusBadRequest, types.ApiError("Invalid/missing parameters"))
		return
	}

	code, response := services.User.Signup(reqBody.Email, reqBody.Username, reqBody.Password)
	c.JSON(code, response)
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
func (services *UserController) Login(c *gin.Context) {
	// * Get email and password from req
	var reqBody struct {
		Email    string
		Password string
	}

	if c.Bind(&reqBody) != nil {
		c.JSON(http.StatusBadRequest, map[string]any{
			"error": "Invalid/missing parameters",
		})

		return
	}

	httpCode, response := services.User.Login(reqBody.Email, reqBody.Password)
	c.JSON(httpCode, response)
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
func (services *UserController) Refresh(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusInternalServerError, types.ApiError("Something went wrong"))
		return
	}

	userPtr, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, types.ApiError("Invalid user type"))
		return
	}

	code, response := services.User.RefreshToken(*userPtr)
	c.JSON(code, response)
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
	user, exists := c.Get("user")
	if exists {
		c.JSON(http.StatusOK, gin.H{
			"user": user,
		})
	} else {
		c.Status(http.StatusUnauthorized)
	}
}
