package mongo

import (
	"blogging-app/models"
	"blogging-app/repository"
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoSettingRepository struct {
	collection *mongo.Collection
}

func NewMongoSettingRepository(db *mongo.Database) repository.SettingRepository {
	return &MongoSettingRepository{
		collection: db.Collection("settings"),
	}
}

func (r *MongoSettingRepository) Get(ctx context.Context) (*models.AppSettings, error) {
	var settings models.AppSettings
	err := r.collection.FindOne(ctx, bson.M{"_id": models.AppSettingsID}).Decode(&settings)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			// Auto-initialize default settings if missing
			defaults := models.DefaultSettings()
			_ = r.Update(ctx, &defaults)
			return &defaults, nil
		}
		return nil, err
	}
	return &settings, nil
}

func (r *MongoSettingRepository) Update(ctx context.Context, settings *models.AppSettings) error {
	settings.UpdatedAt = time.Now().UTC()
	opts := options.UpdateOne().SetUpsert(true)

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": models.AppSettingsID},
		bson.M{
			"$set": bson.M{
				"allow_registration": settings.AllowRegistration,
				"updated_at":         settings.UpdatedAt,
			},
		},
		opts,
	)
	return err
}
