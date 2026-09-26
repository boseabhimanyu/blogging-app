package mongo

import (
	"blogging-app/models"
	"blogging-app/repository"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoCategoryRepository struct {
	collection *mongo.Collection
}

func NewMongoCategoryRepository(db *mongo.Database) repository.CategoryRepository {
	return &MongoCategoryRepository{
		collection: db.Collection("categories"),
	}
}

func (r *MongoCategoryRepository) Create(ctx context.Context, category *models.Category) error {
	category.ID = bson.NewObjectID()
	now := time.Now().UTC()
	category.CreatedAt = now
	category.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, category)
	return err
}

func (r *MongoCategoryRepository) FindByID(ctx context.Context, id bson.ObjectID) (*models.Category, error) {
	var category models.Category
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&category)
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *MongoCategoryRepository) FindBySlug(ctx context.Context, slug string) (*models.Category, error) {
	var category models.Category
	err := r.collection.FindOne(ctx, bson.M{"slug": slug}).Decode(&category)
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *MongoCategoryRepository) FindByName(ctx context.Context, name string) (*models.Category, error) {
	var category models.Category
	// Case-insensitive name match
	filter := bson.M{"name": bson.M{"$regex": "^" + name + "$", "$options": "i"}}
	err := r.collection.FindOne(ctx, filter).Decode(&category)
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *MongoCategoryRepository) List(ctx context.Context) ([]models.Category, error) {
	opts := options.Find().SetSort(bson.D{{Key: "name", Value: 1}})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	categories := make([]models.Category, 0)
	if err := cursor.All(ctx, &categories); err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *MongoCategoryRepository) Update(ctx context.Context, category *models.Category) error {
	category.UpdatedAt = time.Now().UTC()
	filter := bson.M{"_id": category.ID}
	update := bson.M{"$set": category}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *MongoCategoryRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

func (r *MongoCategoryRepository) FindBySlugs(ctx context.Context, slugs []string) ([]models.Category, error) {
	if len(slugs) == 0 {
		return []models.Category{}, nil
	}

	filter := bson.M{"slug": bson.M{"$in": slugs}}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	categories := make([]models.Category, 0)
	if err := cursor.All(ctx, &categories); err != nil {
		return nil, err
	}
	return categories, nil
}
