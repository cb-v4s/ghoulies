package controllers

import (
	"core/internal/adapters/database/models"
	"core/internal/adapters/http/middleware"
	core "core/internal/core"
	"core/internal/core/services"
	"core/types"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	DefaultSameSiteAttr = http.SameSiteLaxMode // * GET, HEAD or OPTIONS only
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

var (
	ErrorInvalidUser        = errors.New("invalid user")
	ErrorSomethingWentWrong = errors.New("something went wrong")
	ErrorMissingParameters  = errors.New("invalid/missing params")
)

func setAuthCookie(c *gin.Context, key string, value string, exp int) {
	c.SetSameSite(DefaultSameSiteAttr)
	c.SetCookie(key, value, exp, "/", "localhost", false, false)
}

func setCsrfCookie(c *gin.Context, token string) {
	c.SetSameSite(DefaultSameSiteAttr)
	c.SetCookie(middleware.CSRFCookieKey, token, int(core.RefreshTokenExpTime.Seconds()), "/", "localhost", false, false)
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
		c.JSON(http.StatusBadRequest, types.ApiError(ErrorMissingParameters))
		return
	}

	err := services.User.Signup(reqBody.Email, reqBody.Username, reqBody.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ApiError(err))
	}

	c.Status(http.StatusOK)
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
		c.JSON(http.StatusBadRequest, types.ApiError(ErrorSomethingWentWrong))
		return
	}

	authTokens, err := services.User.Login(reqBody.Email, reqBody.Password)
	if err != nil {
		fmt.Printf("Error: %s", err)
		c.JSON(http.StatusBadRequest, types.ApiError(err))
		return
	}

	setAuthCookie(c, core.CookieAccessToken, authTokens.AccessToken, int((time.Hour * 24).Seconds()))
	setAuthCookie(c, core.CookieRefreshToken, authTokens.RefreshToken, int((time.Hour * 24).Seconds()))

	token, err := middleware.GetCSRFToken()
	if err != nil {
		c.Status(http.StatusInternalServerError)
	}

	setCsrfCookie(c, *token)

	c.Status(http.StatusOK)
}

// Refresh Token
// @Summary Get a new access token
//
//	@Tags         user
//
// @Success      200  {object}  RefreshTokenSuccessResponse "Success response"
// @Failure      400  {object}  RefreshTokenErrorResponse "Failed response"
// @Router /api/v1/user/refresh  [get]
func (services *UserController) Refresh(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusInternalServerError, types.ApiError(fmt.Errorf("something went wrong 1 %v, %v", user, exists)))
		return
	}

	userPtr, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, types.ApiError(ErrorInvalidUser))
		return
	}

	response, err := services.User.RefreshToken(*userPtr)
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}

	token, err := middleware.GetCSRFToken()
	if err != nil {
		c.Status(http.StatusInternalServerError)
	}

	setCsrfCookie(c, *token)
	setAuthCookie(c, core.CookieAccessToken, response.AccessToken, int((time.Hour * 24).Seconds()))

	c.Status(http.StatusOK)
}

func (services *UserController) GetUserProfile(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.Status(http.StatusUnauthorized)
	}

	userPtr, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, types.ApiError(ErrorInvalidUser))
		return
	}

	user, err := services.User.GetProfile(userPtr.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ApiError(err))
	}

	c.JSON(http.StatusOK, types.ApiResponse{
		"user": user,
	})
}

func (services *UserController) UpdateUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.Status(http.StatusUnauthorized)
	}

	userPtr, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, types.ApiError(ErrorInvalidUser))
		return
	}

	var reqBody types.UpdateUser

	if c.ShouldBindJSON(&reqBody) != nil {
		c.JSON(http.StatusBadRequest, types.ApiError(ErrorMissingParameters))
		return
	}

	authTokens, err := services.User.Update(userPtr.ID, reqBody)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ApiError(err))
		return
	}

	setAuthCookie(c, core.CookieAccessToken, authTokens.AccessToken, int((time.Hour * 24).Seconds()))
	setAuthCookie(c, core.CookieRefreshToken, authTokens.RefreshToken, int((time.Hour * 24).Seconds()))

	token, err := middleware.GetCSRFToken()
	if err != nil {
		c.Status(http.StatusInternalServerError)
	}

	setCsrfCookie(c, *token)

	c.Status(http.StatusOK)
}
