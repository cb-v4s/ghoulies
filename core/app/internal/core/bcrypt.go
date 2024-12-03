package core

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const (
	BcryptCharacterLimit = 72 // ? https://www.ory.sh/docs/troubleshooting/bcrypt-secret-length
)

var (
	ErrorGeneratePasswordHash = errors.New("failed to generate hash from password")
)

func CompareHashAndPassword(userPassword string, inputPassword string) bool {
	if err := bcrypt.CompareHashAndPassword([]byte(userPassword), []byte(inputPassword)); err != nil {
		return false
	}

	return true
}

func GenPasswordHash(password string) (*[]byte, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, ErrorGeneratePasswordHash
	}

	return &passwordHash, nil
}
