package repository

import (
	"blogging-app/models"
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type TagRepository interface {
	Create(ctx context.Context, tag *models.Tag) error
	FindByID(ctx context.Context, id bson.ObjectID) (*models.Tag, error)
	FindBySlug(ctx context.Context, slug string) (*models.Tag, error)
	FindByIDs(ctx context.Context, ids []bson.ObjectID) ([]models.Tag, error)
	List(ctx context.Context, query string, limit int64) ([]models.Tag, error)
	Update(ctx context.Context, tag *models.Tag) error
	Delete(ctx context.Context, id bson.ObjectID) error
}
