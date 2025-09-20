package dtos

type CreateSettingsDto struct {
	GuildId       string   `bson:"guildId" json:"guildId"`
	BumpRoleIds   []string `bson:"bumpRoleIds" json:"bumpRoleIds"`
	BumpBanRoleId *string  `bson:"bumpBanRoleId" json:"bumpBanRoleId"`
	PingChannelId *string  `bson:"pingChannelId" json:"pingChannelId"`
	LogChannelId  *string  `bson:"logChannelId" json:"logChannelId"`
	UseForceOnly  bool     `bson:"useForceOnly" json:"useForceOnly"`
	Force         int      `bson:"force" json:"force"`
}

type UpdateSettingsDto struct {
	BumpRoleIds   []string `bson:"bumpRoleIds" json:"bumpRoleIds" validate:"required"`
	BumpBanRoleId *string  `bson:"bumpBanRoleId" json:"bumpBanRoleId" validate:"required"`
	PingChannelId *string  `bson:"pingChannelId" json:"pingChannelId" validate:"required"`
	LogChannelId  *string  `bson:"logChannelId" json:"logChannelId" validate:"required"`
	UseForceOnly  bool     `bson:"useForceOnly" json:"useForceOnly" validate:"required"`
	Force         int      `bson:"force" json:"force" validate:"max=7200"`
}
