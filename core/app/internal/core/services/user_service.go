package services

import (
	"core/internal/adapters/database/models"
	"core/internal/core"
	repositories "core/internal/ports"
	"core/types"
	"errors"
	"fmt"
	"strings"
)

const (
	minPasswordLen = 6
)

var (
	ErrorInvalidCredentials = errors.New("invalid Email and/or Password")
	ErrorEmailNotRegistered = errors.New("email is not registered")

	ErrorEmailAlreadyRegistered    = errors.New("email already exists")
	ErrorUsernameAlreadyRegistered = errors.New("username already exists")
	ErrorFailedToHashPassword      = errors.New("failed to hash password")
	ErrorPasswordLenExceeded       = errors.New("password must be no longer than 72 characters")
	ErrorInvalidPasswordLen        = fmt.Errorf("password must be at least %d characters long", minPasswordLen)
	ErrorSaveFailed                = errors.New("failed to save")
	ErrorUserNotFound              = errors.New("user not found")
)

type UserService struct {
	userRepo *repositories.UserRepoContext
	logger   core.LoggerI
}

func NewUserService(logger core.LoggerI, userRepo *repositories.UserRepoContext) *UserService {
	return &UserService{
		userRepo: userRepo,
		logger:   logger,
	}
}

type RefreshTokenResponse struct {
	AccessToken string `json:"accessToken"`
}

// services should return an error and a response any
// controllers send the http.Status and ApiError
func (ctx *UserService) Login(email string, password string) (*core.AuthTokensResponse, error) {
	user, err := ctx.userRepo.GetByEmail(email)
	if err != nil {
		return nil, ErrorEmailNotRegistered
	}

	if user.ID == 0 {
		return nil, ErrorInvalidCredentials
	}

	authorized := core.CompareHashAndPassword(user.Password, password)
	if !authorized {
		return nil, ErrorInvalidCredentials
	}

	// * Generate jwt access and refresh pair tokens
	authTokens, err := core.GetTokensPair(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	// * Send a response
	return authTokens, nil
}

func (ctx *UserService) Signup(email string, username string, password string) error {
	if len(password) > core.BcryptCharacterLimit {
		return ErrorPasswordLenExceeded
	}

	if len(password) < minPasswordLen {
		return ErrorInvalidPasswordLen
	}

	// * 2. Check if Email or Username is already stored
	exists := ctx.userRepo.ExistsEmail(email)
	if exists {
		return ErrorEmailAlreadyRegistered
	}

	exists = ctx.userRepo.ExistsUsername(username)
	if exists {
		return ErrorUsernameAlreadyRegistered
	}

	// * 3. Hash password
	passwordHash, err := core.GenPasswordHash(password)
	if err != nil {
		return ErrorFailedToHashPassword
	}

	// * 4. Save user
	user := models.User{
		Email:    email,
		Username: strings.TrimSpace(username),
		Password: string(*passwordHash),
	}

	if _, err := ctx.userRepo.Save(user); err != nil {
		return ErrorSaveFailed
	}

	// * 5. Send a response
	return nil
}

func (ctx *UserService) RefreshToken(user models.User) (*RefreshTokenResponse, error) {
	refreshTokenString, err := core.GenerateToken(user.ID, user.Username, "refresh")
	if err != nil {
		return nil, err
	}

	return &RefreshTokenResponse{AccessToken: *refreshTokenString}, nil
}

func (ctx *UserService) Update(userId uint, updateUser types.UpdateUser) (*core.AuthTokensResponse, error) {
	if updateUser.Password != nil && len(*updateUser.Password) < minPasswordLen {
		return nil, ErrorInvalidPasswordLen
	}

	if updateUser.UserName != nil && ctx.userRepo.ExistsUsername(*updateUser.UserName) {
		return nil, repositories.ErrorUsernameExists
	}

	user, err := ctx.userRepo.Update(userId, updateUser)
	if err != nil {
		return nil, ErrorSaveFailed
	}

	authTokens, err := core.GetTokensPair(userId, user.Username)
	if err != nil {
		return nil, err
	}

	return authTokens, nil
}

type GetUserProfile struct {
	UserID    uint   `json:"userId"`
	Email     string `json:"email"`
	Username  string `json:"username"`
	CreatedAt int64  `json:"createdAt"` // timestamp
}

func (ctx *UserService) GetProfile(userId uint) (*GetUserProfile, error) {
	user, err := ctx.userRepo.GetById(float64(userId))
	if err != nil {
		return nil, ErrorUserNotFound
	}

	return &GetUserProfile{
		UserID:    user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt.Unix(),
	}, nil
}
