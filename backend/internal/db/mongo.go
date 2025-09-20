package db

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2/log"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func NewMongoDb(dsn string) *mongo.Database {
	client, err := mongo.Connect(options.Client().SetRetryReads(true).SetRetryWrites(true).SetTimeout(time.Second * 10).ApplyURI(dsn))
	if err != nil {
		panic(fmt.Sprintf("failed to connect to mongodb %v", err))
	}

	err = client.Ping(context.Background(), nil)

	if err != nil {
		panic(fmt.Sprintf("failed to ping mongodb %v", err))
	}

	log.Info("connected to mongodb")

	db := client.Database("test")

	return db
}
