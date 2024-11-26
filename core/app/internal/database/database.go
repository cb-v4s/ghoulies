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
	sslMode := "disable"
	if config.Database.SSL {
		sslMode = "require"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s", config.Database.Host, config.Database.User, config.Database.Password, config.Database.Database, config.Database.Port, sslMode)

	DbCtx, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Something went wrong trying to established a db connection: %v", err)
		return
	}

	fmt.Printf("Database connection established sslmode=%s\n", sslMode)

	// sync database models
	DbCtx.AutoMigrate(&models.User{})

}
