package repositories

import (
	"api/enums"
	"api/internal/dtos"
	"api/internal/models"
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type BumpRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewBumpRepository(db *mongo.Database) *BumpRepository {
	return &BumpRepository{
		db:         db,
		collection: db.Collection(models.BumpModelCollectionName),
	}
}

func (b *BumpRepository) FindBump(id bson.ObjectID) (models.BumpModel, error) {
	var result models.BumpModel

	err := b.collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&result)

	return result, err
}

func (b *BumpRepository) CreateBump(dto dtos.CreateBumpDto) (*models.BumpModel, error) {
	var bump models.BumpModel

	r, err := b.collection.InsertOne(context.Background(), dto)

	if err != nil {
		return nil, err
	}

	id, ok := r.InsertedID.(bson.ObjectID)

	if !ok {
		return nil, errors.New("unable to convert to object id")
	}

	bump, err = b.FindBump(id)

	return &bump, nil
}

type UserBumps struct {
	Up     int `json:"up"`
	Like   int `json:"like"`
	Bump   int `json:"bump"`
	Points int `json:"points"`
}

func (b *BumpRepository) FindUserBumps(guildId string, userId string, fromP time.Time, toP time.Time) (*UserBumps, error) {
	var result UserBumps

	from := fromP
	to := toP
	if fromP.After(toP) {
		from = toP
		to = fromP
	}

	from = time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, time.UTC)
	to = time.Date(to.Year(), to.Month(), to.Day(), 23, 59, 59, 999999999, time.UTC)

	pipeline := mongo.Pipeline{
		{
			{Key: "$match", Value: bson.M{
				"guildId":   guildId,
				"userId":    userId,
				"createdAt": bson.M{"$gte": from, "$lte": to},
			}},
		},
		{
			{Key: "$group", Value: bson.M{
				"_id": nil,
				"up": bson.M{
					"$sum": bson.M{
						"$cond": bson.A{
							bson.M{"$eq": bson.A{"$type", enums.SdcMonitoring}},
							1,
							0,
						},
					},
				},
				"like": bson.M{
					"$sum": bson.M{
						"$cond": bson.A{
							bson.M{"$eq": bson.A{"$type", enums.DsMonitoring}},
							1,
							0,
						},
					},
				},
				"bump": bson.M{
					"$sum": bson.M{
						"$cond": bson.A{
							bson.M{"$eq": bson.A{"$type", enums.ServerMonitoring}},
							1,
							0,
						},
					},
				},
				"points": bson.M{
					"$sum": "$points",
				},
			}},
		},
	}

	cursor, err := b.collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	if cursor.Next(context.Background()) {
		if err := cursor.Decode(&result); err != nil {
			return nil, err
		}
	}

	return &result, nil
}

//type bumpDates struct {
//	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
//}

//func (b *BumpRepository) FindBumpDates(guildId string, from *time.Time, to *time.Time) ([]time.Time, error) {
//	filter := bson.M{"guildId": guildId}
//
//	if from != nil {
//		filter["createdAt"] = bson.M{}
//	}
//
//	pipeline := mongo.Pipeline{
//		bson.D{
//
//		}
//	}
//}
