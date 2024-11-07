package config

import "os"

type Postgres struct {
	Database string
	Host     string
	Port     string
	User     string
	Password string
}

var (
	GinMode            = os.Getenv("GIN_MODE") // server debug/prod mode
	AllowOrigins       = os.Getenv("ALLOWED_ORIGINS")
	PORT               = os.Getenv("PORT")
	KafkaBrokers       = os.Getenv("KAFKA_BROKERS")
	JwtSecret          = os.Getenv("JWT_SECRET")
	ChatbotName        = os.Getenv("CHATBOT_NAME")
	WelcomeRoomName    = os.Getenv("WELCOME_ROOM_NAME")
	RedisServer        = os.Getenv("REDIS_SERVER")
	RedisPassword      = os.Getenv("REDIS_PASSWORD")
	WsConnectionsLimit = os.Getenv("WSCONN_LIMIT")

	Database = Postgres{
		Database: os.Getenv("POSTGRES_DATABASE"),
		Host:     os.Getenv("POSTGRES_HOST"),
		Port:     os.Getenv("POSTGRES_PORT"),
		User:     os.Getenv("POSTGRES_USER"),
		Password: os.Getenv("POSTGRES_PASS"),
	}
)
