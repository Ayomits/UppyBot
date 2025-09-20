package config

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type ConfigService struct{}

func NewConfigService() ConfigService {
	err := godotenv.Load()
	if err != nil {
		log.Print("No .env file found, using system environment variables")
	}
	return ConfigService{}
}

func (c *ConfigService) Get(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		panic(errors.New("config key does not exist"))
	}
	return value
}

var ConfigServiceInstance = NewConfigService()

var (
	MongoUrl = ConfigServiceInstance.Get("MONGO_URL")
)
