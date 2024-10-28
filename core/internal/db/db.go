package db

import (
	"core/internal/db/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DbCtx *gorm.DB

func InitDb() {
	var err error
	dsn := os.Getenv("DB_URL")

	DbCtx, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Something went wrong trying to established a db connection: %s", err)
		return
	}

	// sync database models
	DbCtx.AutoMigrate(&models.User{})
}
