package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type PostStatus string

const (
	PostStatusDraft           PostStatus = "draft"
	PostStatusPendingApproval PostStatus = "pending_approval"
	PostStatusPublished       PostStatus = "published"
)

type Post struct {
	ID          bson.ObjectID   `bson:"_id,omitempty" json:"id"`
	Title       string          `bson:"title" json:"title"`
	Slug        string          `bson:"slug" json:"slug"`
	Summary     string          `bson:"summary" json:"summary"`
	Content     string          `bson:"content" json:"content"`
	CoverImage  string          `bson:"cover_image" json:"coverImage"`
	AuthorID    bson.ObjectID   `bson:"author_id" json:"authorId"`
	CategoryIDs []bson.ObjectID `bson:"category_ids" json:"categoryIds"`
	TagIDs      []bson.ObjectID `bson:"tag_ids" json:"tagIds"`
	Status      PostStatus      `bson:"status" json:"status"`
	PublishedAt *time.Time      `bson:"published_at" json:"publishedAt"`
	CreatedAt   time.Time       `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time       `bson:"updated_at" json:"updatedAt"`
}
