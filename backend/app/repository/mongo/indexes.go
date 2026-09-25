package mongo

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	mongodriver "go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func EnsureUserIndexes(
	ctx context.Context,
	db *mongodriver.Database,
) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	collection := db.Collection("users")

	indexes := []mongodriver.IndexModel{
		{
			Keys: bson.D{
				{Key: "email", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_email"),
		},
		{
			Keys: bson.D{
				{Key: "username", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_username"),
		},
		{
			Keys: bson.D{
				{Key: "phone", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_phone"),
		},
		{
			Keys: bson.D{
				{Key: "alt_email", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetPartialFilterExpression(
					bson.M{
						"alt_email": bson.M{
							"$gt": "",
						},
					},
				).
				SetName("unique_alt_email"),
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)

	return err
}

func EnsurePostIndexes(ctx context.Context, db *mongo.Database) error {
	posts := db.Collection("posts")

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "slug", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{
				{Key: "status", Value: 1},
				{Key: "published_at", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "author_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
		// Add this to your EnsurePostIndexes function:
		{
			Keys:    bson.D{{Key: "slug", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{
				{Key: "tag_ids", Value: 1},
				{Key: "status", Value: 1},
			},
		},
	}

	_, err := posts.Indexes().CreateMany(ctx, indexes)
	return err
}
