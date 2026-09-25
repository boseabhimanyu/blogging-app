package services

import (
	"blogging-app/dto"
	"blogging-app/models"
	"blogging-app/repository"
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

var (
	ErrPostNotFound        = errors.New("post not found")
	ErrForbidden           = errors.New("you do not have permission to perform this action")
	ErrInvalidStatus       = errors.New("invalid post status")
	ErrUnauthorizedPublish = errors.New("only admins can publish or unpublish posts")
	ErrDuplicateSlug       = errors.New("could not generate a unique slug")
)

type PostService struct {
	postRepo repository.PostRepository
	tagRepo  repository.TagRepository // Kept optional / unused for now
}

func NewPostService(postRepo repository.PostRepository, tagRepo repository.TagRepository) *PostService {
	return &PostService{
		postRepo: postRepo,
		tagRepo:  tagRepo,
	}
}

// CreatePost allows the author (publisher/admin) to save as draft or publish immediately
func (s *PostService) CreatePost(ctx context.Context, authorID bson.ObjectID, authorRole models.UserRole, req dto.CreatePostRequest) (*models.Post, error) {
	slug, err := s.generateUniqueSlug(ctx, req.Title)
	if err != nil {
		return nil, err
	}

	initialStatus := models.PostStatusDraft
	var publishedAt *time.Time

	// If the author explicitly sets status to published, publish right away
	if req.Status == models.PostStatusPublished {
		initialStatus = models.PostStatusPublished
		now := time.Now().UTC()
		publishedAt = &now
	}

	// Categories are optional
	categoryObjectIDs := make([]bson.ObjectID, 0)
	if len(req.CategoryIDs) > 0 {
		for _, idHex := range req.CategoryIDs {
			if objID, err := bson.ObjectIDFromHex(idHex); err == nil {
				categoryObjectIDs = append(categoryObjectIDs, objID)
			}
		}
	}

	// Tags are optional
	tagObjectIDs := make([]bson.ObjectID, 0)
	if len(req.TagIDs) > 0 {
		for _, idHex := range req.TagIDs {
			if objID, err := bson.ObjectIDFromHex(idHex); err == nil {
				tagObjectIDs = append(tagObjectIDs, objID)
			}
		}
	}

	now := time.Now().UTC()
	post := &models.Post{
		Title:       strings.TrimSpace(req.Title),
		Slug:        slug,
		Summary:     strings.TrimSpace(req.Summary),
		Content:     req.Content,
		CoverImage:  req.CoverImage,
		AuthorID:    authorID,
		CategoryIDs: categoryObjectIDs,
		TagIDs:      tagObjectIDs,
		Status:      initialStatus,
		PublishedAt: publishedAt,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.postRepo.Create(ctx, post); err != nil {
		return nil, err
	}

	return post, nil
}

// GetPostBySlug fetches a published post for the public, or a draft if requested by author or admin
func (s *PostService) GetPostBySlug(ctx context.Context, slug string, viewerID *bson.ObjectID, viewerRole *models.UserRole) (*models.Post, error) {
	post, err := s.postRepo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, ErrPostNotFound
	}

	if post.Status == models.PostStatusPublished {
		return post, nil
	}

	// If draft, only author or admin can view
	if viewerID == nil || viewerRole == nil {
		return nil, ErrPostNotFound
	}

	if *viewerRole == models.RoleAdmin || post.AuthorID == *viewerID {
		return post, nil
	}

	return nil, ErrPostNotFound
}

// UpdatePost modifies post fields and allows the author or an admin to publish/unpublish
func (s *PostService) UpdatePost(ctx context.Context, postID bson.ObjectID, actorID bson.ObjectID, actorRole models.UserRole, req dto.UpdatePostRequest) (*models.Post, error) {
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		return nil, ErrPostNotFound
	}

	// Access control: author or platform admin
	if actorRole != models.RoleAdmin && post.AuthorID != actorID {
		return nil, ErrForbidden
	}

	if req.Title != nil && strings.TrimSpace(*req.Title) != "" && strings.TrimSpace(*req.Title) != post.Title {
		post.Title = strings.TrimSpace(*req.Title)
		newSlug, err := s.generateUniqueSlug(ctx, post.Title)
		if err != nil {
			return nil, err
		}
		post.Slug = newSlug
	}

	if req.Summary != nil {
		post.Summary = strings.TrimSpace(*req.Summary)
	}

	if req.Content != nil {
		post.Content = *req.Content
	}

	if req.CoverImage != nil {
		post.CoverImage = *req.CoverImage
	}

	if req.CategoryIDs != nil {
		categoryObjectIDs := make([]bson.ObjectID, 0)
		for _, idHex := range *req.CategoryIDs {
			if objID, err := bson.ObjectIDFromHex(idHex); err == nil {
				categoryObjectIDs = append(categoryObjectIDs, objID)
			}
		}
		post.CategoryIDs = categoryObjectIDs
	}

	if req.TagIDs != nil {
		tagObjectIDs := make([]bson.ObjectID, 0)
		for _, idHex := range *req.TagIDs {
			if objID, err := bson.ObjectIDFromHex(idHex); err == nil {
				tagObjectIDs = append(tagObjectIDs, objID)
			}
		}
		post.TagIDs = tagObjectIDs
	}

	// Status change: author or admin can toggle between draft and published
	if req.Status != nil && *req.Status != post.Status {
		if *req.Status != models.PostStatusDraft && *req.Status != models.PostStatusPublished {
			return nil, ErrInvalidStatus
		}

		if *req.Status == models.PostStatusPublished && post.PublishedAt == nil {
			now := time.Now().UTC()
			post.PublishedAt = &now
		}

		post.Status = *req.Status
	}

	post.UpdatedAt = time.Now().UTC()

	if err := s.postRepo.Update(ctx, post); err != nil {
		return nil, err
	}

	return post, nil
}

// DeletePost removes a post (author can delete their own; admin can delete any)
func (s *PostService) DeletePost(ctx context.Context, postID bson.ObjectID, actorID bson.ObjectID, actorRole models.UserRole) error {
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		return ErrPostNotFound
	}

	if actorRole != models.RoleAdmin && post.AuthorID != actorID {
		return ErrForbidden
	}

	return s.postRepo.Delete(ctx, postID)
}

// ListPublished retrieves published posts for the public feed
func (s *PostService) ListPublished(ctx context.Context, categoryID *bson.ObjectID, tagID *bson.ObjectID, page, limit int64) ([]models.Post, int64, error) {
	return s.postRepo.ListPublished(ctx, categoryID, tagID, page, limit)
}

// ListAuthorPosts returns all posts authored by a user (including drafts)
func (s *PostService) ListAuthorPosts(ctx context.Context, authorID bson.ObjectID, page, limit int64) ([]models.Post, int64, error) {
	return s.postRepo.ListByAuthor(ctx, authorID, page, limit)
}

// --- Helper Functions ---

func (s *PostService) generateUniqueSlug(ctx context.Context, title string) (string, error) {
	baseSlug := slugify(title)
	if baseSlug == "" {
		baseSlug = "post"
	}

	slug := baseSlug
	counter := 1

	for {
		existing, err := s.postRepo.FindBySlug(ctx, slug)
		if err != nil || existing == nil {
			return slug, nil
		}

		counter++
		if counter > 100 {
			return "", ErrDuplicateSlug
		}
		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
	}
}

var nonWordRegex = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(input string) string {
	cleaned := strings.ToLower(strings.TrimSpace(input))
	cleaned = nonWordRegex.ReplaceAllString(cleaned, "-")
	return strings.Trim(cleaned, "-")
}
