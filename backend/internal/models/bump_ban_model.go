package models

import "go.mongodb.org/mongo-driver/v2/bson"

const (
	BumpBanModelCollectionName = "bump_bans"
)

type BumpBanModel struct {
	Id       bson.ObjectID `json:"id" bson:"_id"`
	Type     string        `json:"type" bson:"type"`
	UserId   string        `json:"userId" bson:"userId"`
	RemoveIn int           `json:"removeIn" bson:"removeIn"`
}
