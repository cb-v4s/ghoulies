package db

import (
	"core/config"
	"core/internal/database/models"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DbCtx *gorm.DB

func New() {
	var err error
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=require", config.Database.Host, config.Database.User, config.Database.Password, config.Database.Database, config.Database.Port)

	DbCtx, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Something went wrong trying to established a db connection: %v", err)
		return
	}

	fmt.Println("Database connection established")

	// sync database models
	DbCtx.AutoMigrate(&models.User{})

}
