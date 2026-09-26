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

	// Adjusted & New methods
	ListPublished(ctx context.Context, categoryID *bson.ObjectID, tagID *bson.ObjectID, page, limit int64) ([]models.Post, int64, error)
	ListByAuthor(ctx context.Context, authorID bson.ObjectID, page, limit int64) ([]models.Post, int64, error)
	ListPublishedByCategory(ctx context.Context, categoryID bson.ObjectID, limit, skip int64) ([]models.Post, int64, error)
	UpdateCoverImage(ctx context.Context, postID bson.ObjectID, coverPath string) error
	RemoveTagIDFromAllPosts(ctx context.Context, tagID bson.ObjectID) (int64, error)
	CountByTagID(ctx context.Context, tagID bson.ObjectID) (int64, error)
	ListPendingApproval(ctx context.Context, page, limit int64) ([]models.Post, int64, error)
	AdminListPosts(ctx context.Context, authorID *bson.ObjectID, status *models.PostStatus, page, limit int64) ([]models.Post, int64, error)
}
