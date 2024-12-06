package repositories

import (
	"core/internal/adapters/database/models"
	"core/internal/core"
	"core/types"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrorEmailNotFound  = errors.New("email not found")
	ErrorUserIdNotFound = errors.New("user id not found")
	ErrorFailedSave     = errors.New("failed saving")
	ErrorUsernameExists = errors.New("username already exists")
)

type UserRepo interface {
	GetByEmail(email string) (*models.User, error)
	GetById(id string) (*models.User, error)
	ExistsEmail(email string) bool
	ExistsUsername(username string) bool
	Save(user models.User) (*models.User, error)
}

type UserRepoContext struct {
	db *gorm.DB
}

func NewUserRepoContext(db *gorm.DB) *UserRepoContext {
	return &UserRepoContext{
		db: db,
	}
}

func (ctx *UserRepoContext) GetById(id float64) (*models.User, error) {
	var user models.User
	result := ctx.db.First(&user, "id = ?", id)
	if result.Error != nil {
		return nil, ErrorUserIdNotFound
	}

	return &user, nil
}

func (ctx *UserRepoContext) GetByEmail(email string) (*models.User, error) {
	var user models.User
	result := ctx.db.First(&user, "email = ?", email)
	if result.Error != nil {
		return nil, ErrorEmailNotFound
	}

	return &user, nil
}

func (ctx *UserRepoContext) ExistsEmail(email string) bool {
	var count int64
	ctx.db.Model(&models.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}

func (ctx *UserRepoContext) ExistsUsername(username string) bool {
	var count int64
	ctx.db.Model(&models.User{}).Where("username = ?", username).Count(&count)
	return count > 0
}

func (ctx *UserRepoContext) Update(id uint, userUpdates types.UpdateUser) (*models.User, error) {
	var user models.User
	result := ctx.db.First(&user, "id = ?", id)
	if result.Error != nil {
		return nil, ErrorUserIdNotFound
	}

	if userUpdates.Password != nil {
		password, err := core.GenPasswordHash(*userUpdates.Password)
		if err != nil {
			return nil, err
		}

		user.Password = string(*password)
	}

	if userUpdates.UserName != nil {
		if ctx.ExistsUsername(*userUpdates.UserName) {
			return nil, ErrorUsernameExists
		}

		user.Username = *userUpdates.UserName
	}

	if err := ctx.db.Save(&user).Error; err != nil {
		return nil, ErrorFailedSave
	}

	return &user, nil
}

func (ctx *UserRepoContext) Save(user models.User) (*models.User, error) {
	result := ctx.db.Create(&user)
	if result.Error != nil {
		return nil, ErrorFailedSave
	}

	return &user, nil
}
