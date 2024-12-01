package repositories

import (
	"core/internal/adapters/database/models"
	"fmt"

	"gorm.io/gorm"
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
		return nil, fmt.Errorf("user id not found")
	}

	return &user, nil
}

func (ctx *UserRepoContext) GetByEmail(email string) (*models.User, error) {
	var user models.User
	result := ctx.db.First(&user, "email = ?", email)
	if result.Error != nil {
		return nil, fmt.Errorf("email not found")
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

func (ctx *UserRepoContext) Save(user models.User) (*models.User, error) {
	saveResult := ctx.db.Create(&user)
	if saveResult.Error != nil {
		return nil, fmt.Errorf("something failed saving user %v", saveResult.Error)
	}

	return &user, nil
}
