package repository

import (
	"blogging-app/models"
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *models.Category) error
	FindByID(ctx context.Context, id bson.ObjectID) (*models.Category, error)
	FindBySlug(ctx context.Context, slug string) (*models.Category, error)
	FindBySlugs(ctx context.Context, slugs []string) ([]models.Category, error)
	FindByName(ctx context.Context, name string) (*models.Category, error)
	List(ctx context.Context) ([]models.Category, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id bson.ObjectID) error
}
