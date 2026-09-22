package dto

import (
	"time"

	"blogging-app/models"
)

type CreatePostRequest struct {
	Title      string            `json:"title" binding:"required,min=3,max=200"`
	Summary    string            `json:"summary" binding:"max=500"`
	Content    string            `json:"content" binding:"required"` // The rich editor payload
	CoverImage string            `json:"coverImage"`
	Tags       []string          `json:"tags"`
	Status     models.PostStatus `json:"status"` // Can be "draft" or "published"
}

type UpdatePostRequest struct {
	Title      *string            `json:"title"`
	Summary    *string            `json:"summary"`
	Content    *string            `json:"content"`
	CoverImage *string            `json:"coverImage"`
	Tags       *[]string          `json:"tags"`
	Status     *models.PostStatus `json:"status"`
}

type PostResponse struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	Slug        string            `json:"slug"`
	Summary     string            `json:"summary"`
	Content     string            `json:"content"`
	CoverImage  string            `json:"coverImage"`
	AuthorID    string            `json:"authorId"`
	Tags        []string          `json:"tags"`
	Status      models.PostStatus `json:"status"`
	PublishedAt *time.Time        `json:"publishedAt"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

func ToPostResponse(post *models.Post) PostResponse {
	return PostResponse{
		ID:          post.ID.Hex(),
		Title:       post.Title,
		Slug:        post.Slug,
		Summary:     post.Summary,
		Content:     post.Content,
		CoverImage:  post.CoverImage,
		AuthorID:    post.AuthorID.Hex(),
		Tags:        post.Tags,
		Status:      post.Status,
		PublishedAt: post.PublishedAt,
		CreatedAt:   post.CreatedAt,
		UpdatedAt:   post.UpdatedAt,
	}
}
