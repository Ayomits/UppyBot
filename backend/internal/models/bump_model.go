package models

import "go.mongodb.org/mongo-driver/v2/bson"

const (
	BumpModelCollectionName = "bumps"
)

type BumpModel struct {
	Id         bson.ObjectID `json:"id" bson:"_id"`
	GuildId    string        `json:"guildId" bson:"guildId"`
	Type       string        `json:"type" bson:"type"`
	ExecutorId string        `json:"executorId" bson:"executorId"`
	MessageId  string        `json:"messageId" bson:"messageId"`
	Points     int           `json:"points" bson:"points"`
}
