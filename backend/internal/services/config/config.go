package config

import (
	"errors"
	"fmt"
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
		panic(errors.New(fmt.Sprintf("Environment variable %s not found", key)))
	}
	return value
}

var ConfigServiceInstance = NewConfigService()

var (
	MongoUrl = ConfigServiceInstance.Get("MONGO_URL")
	AppEnv   = ConfigServiceInstance.Get("APP_ENV")
)
