package dto

import (
	"blogging-app/models"
	"time"
)

type CreatePostRequest struct {
	Title       string            `json:"title" binding:"required,min=3,max=200"`
	Summary     string            `json:"summary" binding:"max=500"`
	Content     string            `json:"content" binding:"required"`
	CoverImage  string            `json:"coverImage"`
	CategoryIDs []string          `json:"categoryIds"` // Optional array of hex IDs
	TagIDs      []string          `json:"tagIds"`      // Optional array of hex IDs
	Status      models.PostStatus `json:"status"`
}

type UpdatePostRequest struct {
	Title       *string            `json:"title"`
	Slug        *string            `json:"slug"` // Custom slug update
	Summary     *string            `json:"summary"`
	Content     *string            `json:"content"`
	CoverImage  *string            `json:"coverImage"`
	CategoryIDs *[]string          `json:"categoryIds"`
	TagIDs      *[]string          `json:"tagIds"`
	Status      *models.PostStatus `json:"status"`
}

type PostResponse struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	Slug        string            `json:"slug"`
	Summary     string            `json:"summary"`
	Content     string            `json:"content"`
	CoverImage  string            `json:"coverImage"`
	AuthorID    string            `json:"authorId"`
	Tags        []TagResponse     `json:"tags"` // Populated tag objects
	Status      models.PostStatus `json:"status"`
	PublishedAt *time.Time        `json:"publishedAt"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}
