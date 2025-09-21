package dtos

type CreateBumpDto struct {
	GuildId    string `bson:"guildId" json:"guildId" validate:"required"`
	Type       int    `bson:"type" json:"type"`
	ExecutorId string `bson:"executorId" json:"executorId" validate:"required"`
	MessageId  string `bson:"messageId" json:"messageId" validate:"required"`
	Points     int    `bson:"points" json:"points"`
}
