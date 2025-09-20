package repositories

import (
	"api/internal/dtos"
	"api/internal/models"
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type SettingsRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewSettingsRepository(db *mongo.Database) *SettingsRepository {
	collection := db.Collection(models.SettingsModelCollectionName)
	return &SettingsRepository{db: db, collection: collection}
}

func (s *SettingsRepository) ExistsSettingsByGuildId(guildId string) bool {
	count, err := s.collection.CountDocuments(context.Background(), bson.M{"guildId": guildId})

	if errors.Is(err, mongo.ErrNoDocuments) {
		return false
	}

	return count > 0
}

func (s *SettingsRepository) FindSettingsByGuildId(guildId string) (*models.SettingsModel, error) {
	var settings models.SettingsModel
	err := s.collection.FindOne(context.Background(), bson.M{"guildId": guildId}).Decode(&settings)

	return &settings, err
}

func (s *SettingsRepository) InsertSettings(dto dtos.CreateSettingsDto) (*models.SettingsModel, error) {
	filter := bson.M{"guildId": dto.GuildId}
	update := bson.M{"$setOnInsert": dto}
	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var settings models.SettingsModel
	err := s.collection.FindOneAndUpdate(
		context.Background(),
		filter,
		update,
		opts,
	).Decode(&settings)

	if err != nil {
		return nil, err
	}

	return &settings, nil
}
func (s *SettingsRepository) UpdateSettings(guildId string, dto dtos.UpdateSettingsDto) (*models.SettingsModel, error) {
	var settings models.SettingsModel

	opts := options.FindOneAndUpdate().
		SetReturnDocument(options.After)

	err := s.collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"guildId": guildId},
		bson.M{"$set": dto},
		opts,
	).Decode(&settings)

	if err != nil {
		return nil, err
	}

	return &settings, nil
}
