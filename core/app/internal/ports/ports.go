package repositories

import "gorm.io/gorm"

type Repositories struct {
	User UserRepoContext
}

func InitializeRepositories(db *gorm.DB) (*Repositories, error) {
	userRepo := NewUserRepoContext(db)

	return &Repositories{
		User: *userRepo,
	}, nil
}
