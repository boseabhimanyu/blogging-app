package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type PostStatus string

const (
	PostStatusDraft     PostStatus = "draft"
	PostStatusPublished PostStatus = "published"
	PostStatusArchived  PostStatus = "archived"
)

type Post struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string        `bson:"title" json:"title"`
	Slug        string        `bson:"slug" json:"slug"`              // SEO-friendly URL identifier
	Summary     string        `bson:"summary" json:"summary"`        // Brief excerpt for cards/previews
	Content     string        `bson:"content" json:"content"`        // HTML/Markdown from your rich editor
	CoverImage  string        `bson:"cover_image" json:"coverImage"` // Optional header image URL/path
	AuthorID    bson.ObjectID `bson:"author_id" json:"authorId"`     // Links to User.ID
	Tags        []string      `bson:"tags" json:"tags"`
	Status      PostStatus    `bson:"status" json:"status"` // draft, published, archived
	PublishedAt *time.Time    `bson:"published_at" json:"publishedAt"`
	CreatedAt   time.Time     `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updatedAt"`
}
