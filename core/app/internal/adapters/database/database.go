package db

import (
	"core/config"
	"core/internal/adapters/database/models"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func New() (*gorm.DB, error) {
	var err error
	sslMode := "disable"
	if config.Database.UseSSL {
		sslMode = "require"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s", config.Database.Host, config.Database.User, config.Database.Password, config.Database.Database, config.Database.Port, sslMode)

	dbCtx, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("something went wrong trying to established a db connection: %v", err)
	}

	fmt.Printf("Database connection established sslmode=%s\n", sslMode)

	dbModels := []interface{}{&models.User{}}

	fmt.Printf("Auto-migrating database models")

	if err := dbCtx.AutoMigrate(dbModels...); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate models")
	}

	fmt.Printf("Auto-migrate database models success")

	return dbCtx, nil
}
