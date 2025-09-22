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
	ManagerRoles  []string      `json:"managerRoles" bson:"managerRoles"`
	LogChannelId  *string       `json:"logChannelId" bson:"logChannelId"`
	UseForceOnly  bool          `json:"useForceOnly" bson:"useForceOnly"`
	Force         int           `json:"force" bson:"force"`
	CreatedAt     time.Time     `json:"createdAt" bson:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt" bson:"updatedAt"`
}
