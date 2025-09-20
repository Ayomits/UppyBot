package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const (
	SettingsModelCollectionName = "helper_bot_settings"
)

type SettingsModel struct {
	Id            bson.ObjectID `json:"id" bson:"_id"`
	GuildId       string        `json:"guildId" bson:"guildId"`
	BumpRoleIds   []string      `json:"bumpRoleIds" bson:"bumpRoleIds"`
	BumpBanRoleId *string       `json:"bumpBanRoleId" bson:"bumpBanRoleId"`
	PingChannelId *string       `json:"pingChannelId" bson:"pingChannelId"`
	LogChannelId  *string       `json:"logChannelId" bson:"logChannelId"`
	UseForceOnly  bool          `json:"useForceOnly" bson:"useForceOnly"`
	Force         int           `json:"force" bson:"force"`
	CreatedAt     time.Time     `json:"createdAt" bson:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt" bson:"updatedAt"`
}

func NewSettingsModel(id bson.ObjectID, guildId string, bumpRoleIds []string, bumpBanRoleId *string, pingChannelId *string, logChannelId *string, useForceOnly bool, force int, createdAt time.Time, updatedAt time.Time) *SettingsModel {
	return &SettingsModel{
		Id:            id,
		GuildId:       guildId,
		BumpRoleIds:   bumpRoleIds,
		BumpBanRoleId: bumpBanRoleId,
		PingChannelId: pingChannelId,
		LogChannelId:  logChannelId,
		UseForceOnly:  useForceOnly,
		Force:         force,
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}
}

func NewEmptySettingsModel(guildId string, objectId bson.ObjectID) *SettingsModel {
	return &SettingsModel{
		Id:            objectId,
		GuildId:       guildId,
		BumpRoleIds:   []string{},
		BumpBanRoleId: nil,
		PingChannelId: nil,
		LogChannelId:  nil,
		UseForceOnly:  false,
		Force:         0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
}
