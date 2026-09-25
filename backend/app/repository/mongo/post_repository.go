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

var (
	ErrPostNotFound = errors.New("post not found")
)

type MongoPostRepository struct {
	collection *mongo.Collection
}

func NewMongoPostRepository(db *mongo.Database) repository.PostRepository {
	return &MongoPostRepository{
		collection: db.Collection("posts"),
	}
}

func (r *MongoPostRepository) Create(ctx context.Context, post *models.Post) error {
	post.ID = bson.NewObjectID()
	now := time.Now().UTC()
	post.CreatedAt = now
	post.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, post)
	return err
}

func (r *MongoPostRepository) FindByID(ctx context.Context, id bson.ObjectID) (*models.Post, error) {
	var post models.Post
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}
	return &post, nil
}

func (r *MongoPostRepository) FindBySlug(ctx context.Context, slug string) (*models.Post, error) {
	var post models.Post
	err := r.collection.FindOne(ctx, bson.M{"slug": slug}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}
	return &post, nil
}

func (r *MongoPostRepository) Update(ctx context.Context, post *models.Post) error {
	post.UpdatedAt = time.Now().UTC()

	filter := bson.M{"_id": post.ID}
	update := bson.M{"$set": post}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return ErrPostNotFound
	}
	return nil
}

func (r *MongoPostRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return ErrPostNotFound
	}
	return nil
}

func (r *MongoPostRepository) ListPublished(ctx context.Context, categoryID *bson.ObjectID, tagID *bson.ObjectID, page, limit int64) ([]models.Post, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	skip := (page - 1) * limit

	filter := bson.M{"status": models.PostStatusPublished}

	// In MongoDB, filter["category_ids"] = *categoryID checks if the array contains that ObjectID
	if categoryID != nil {
		filter["category_ids"] = *categoryID
	}

	if tagID != nil {
		filter["tag_ids"] = *tagID
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(skip).
		SetLimit(limit)

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	posts := make([]models.Post, 0)
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *MongoPostRepository) ListByAuthor(ctx context.Context, authorID bson.ObjectID, page, limit int64) ([]models.Post, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	skip := (page - 1) * limit

	filter := bson.M{"author_id": authorID}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(skip).
		SetLimit(limit)

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var posts []models.Post
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *MongoPostRepository) RemoveTagIDFromAllPosts(ctx context.Context, tagID bson.ObjectID) (int64, error) {
	filter := bson.M{"tag_ids": tagID}
	update := bson.M{
		"$pull": bson.M{"tag_ids": tagID},
	}

	result, err := r.collection.UpdateMany(ctx, filter, update)
	if err != nil {
		return 0, err
	}
	return result.ModifiedCount, nil
}

func (r *MongoPostRepository) CountByTagID(ctx context.Context, tagID bson.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"tag_ids": tagID})
}

func (r *MongoPostRepository) ListPendingApproval(ctx context.Context, page, limit int64) ([]models.Post, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	skip := (page - 1) * limit

	filter := bson.M{"status": models.PostStatusPendingApproval}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "updated_at", Value: -1}}).
		SetSkip(skip).
		SetLimit(limit)

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var posts []models.Post
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *MongoPostRepository) AdminListPosts(ctx context.Context, authorID *bson.ObjectID, status *models.PostStatus, page, limit int64) ([]models.Post, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	skip := (page - 1) * limit

	filter := bson.M{}

	if authorID != nil {
		filter["author_id"] = *authorID
	}
	if status != nil && *status != "" {
		filter["status"] = *status
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(skip).
		SetLimit(limit)

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	posts := make([]models.Post, 0)
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}
