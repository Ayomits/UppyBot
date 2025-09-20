package models

import "go.mongodb.org/mongo-driver/v2/bson"

const (
	PointSettingsModelCollectionName = "point_settings"
)

type PointSettingsModel struct {
	Id      bson.ObjectID `json:"id" bson:"_id"`
	GuildId string        `json:"guildId" bson:"guildId"`
	Type    string        `json:"type" bson:"type"`
	Default int           `json:"default" bson:"default"`
	Bonus   int           `json:"bonus" bson:"bonus"`
}
