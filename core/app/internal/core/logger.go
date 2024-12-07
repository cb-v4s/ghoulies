package core

import (
	"github.com/sirupsen/logrus"
)

type LoggerI interface {
	Info(message string)
	Warn(message string)
	Error(message string)
}

type Logger struct {
	logger *logrus.Logger
}

func NewLogger() *Logger {
	log := logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		DisableColors: false,
		FullTimestamp: true,
	})

	return &Logger{logger: log}
}

func (l *Logger) Info(message string) {
	l.logger.Info(message)
}

func (l *Logger) Warn(message string) {
	l.logger.Warn(message)
}

func (l *Logger) Error(message string) {
	l.logger.Error(message)
}
