package db

import (
	"core/config"
	"core/internal/database/models"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DbCtx *gorm.DB

func Start() {
	var err error
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", config.Database.Host, config.Database.User, config.Database.Password, config.Database.Database, config.Database.Port)
	fmt.Printf("funcStart ~ dsn: %s", dsn)

	DbCtx, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Something went wrong trying to established a db connection: %v", err)
		return
	}

	// sync database models
	DbCtx.AutoMigrate(&models.User{})
}
