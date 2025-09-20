package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const (
	RemindModelCollectionName = "bump_reminds"
)

type RemindModel struct {
	Id        bson.ObjectID `json:"_id" bson:"_id"`
	GuildId   string        `json:"guildId" bson:"guildId"`
	Type      string        `json:"type" bson:"type"`
	Timestamp time.Time     `json:"timestamp" bson:"timestamp"`
}
