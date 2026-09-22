package repository

import (
	"blogging-app/models"
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type PostRepository interface {
	Create(ctx context.Context, post *models.Post) error
	FindByID(ctx context.Context, id bson.ObjectID) (*models.Post, error)
	FindBySlug(ctx context.Context, slug string) (*models.Post, error)
	Update(ctx context.Context, post *models.Post) error
	Delete(ctx context.Context, id bson.ObjectID) error
	ListPublished(ctx context.Context, page, limit int64) ([]models.Post, int64, error)
	ListByAuthor(ctx context.Context, authorID bson.ObjectID, page, limit int64) ([]models.Post, int64, error)
}
