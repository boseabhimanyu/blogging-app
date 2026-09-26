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
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var (
	ErrPostNotFound        = errors.New("post not found")
	ErrForbidden           = errors.New("you do not have permission to perform this action")
	ErrInvalidStatus       = errors.New("invalid post status")
	ErrUnauthorizedPublish = errors.New("only admins can publish or unpublish posts")
	ErrDuplicateSlug       = errors.New("could not generate a unique slug")
)

type PostService struct {
	postRepo     repository.PostRepository
	categoryRepo repository.CategoryRepository
	tagRepo      repository.TagRepository // Kept optional / unused for now
}

func NewPostService(postRepo repository.PostRepository, tagRepo repository.TagRepository, categoryRepo repository.CategoryRepository) *PostService {
	return &PostService{
		postRepo:     postRepo,
		tagRepo:      tagRepo,
		categoryRepo: categoryRepo,
	}
}

// CreatePost allows the author (publisher/admin) to save as draft or publish immediately
func (s *PostService) CreatePost(ctx context.Context, authorID bson.ObjectID, authorRole models.UserRole, req dto.CreatePostRequest) (*models.Post, error) {
	// 1. Validate status
	initialStatus := models.PostStatusDraft
	var publishedAt *time.Time

	switch req.Status {
	case "", models.PostStatusDraft:
		initialStatus = models.PostStatusDraft
	case models.PostStatusPublished:
		initialStatus = models.PostStatusPublished
		now := time.Now().UTC()
		publishedAt = &now
	default:
		// Any other string (like "pudblished") is invalid
		return nil, ErrInvalidStatus
	}

	// 2. Resolve category slugs (returns ErrInvalidCategory if invalid)
	categoryIDs, err := s.resolveCategoryIDs(ctx, req.CategoryIDs)
	if err != nil {
		return nil, err
	}

	// 3. Generate unique slug
	slug, err := s.generateUniqueSlug(ctx, req.Title)
	if err != nil {
		return nil, err
	}

	// Tags optional
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
		CategoryIDs: categoryIDs,
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

	if req.Title != nil && strings.TrimSpace(*req.Title) != "" {
		post.Title = strings.TrimSpace(*req.Title)
	}

	// Handle Slug update
	if req.Slug != nil && strings.TrimSpace(*req.Slug) != "" {
		cleanedSlug := slugify(*req.Slug)
		if cleanedSlug != "" && cleanedSlug != post.Slug {
			// Check if another post already has this slug
			existing, err := s.postRepo.FindBySlug(ctx, cleanedSlug)
			if err == nil && existing != nil && existing.ID != post.ID {
				return nil, errors.New("slug already in use")
			}
			post.Slug = cleanedSlug
		}
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

	// Resolve category slugs to ObjectIDs and validate their existence
	if req.CategoryIDs != nil {
		categoryIDs, err := s.resolveCategoryIDs(ctx, *req.CategoryIDs)
		if err != nil {
			return nil, err
		}
		post.CategoryIDs = categoryIDs
	}

	// Tags are optional (parsed from hex IDs)
	if req.TagIDs != nil {
		tagObjectIDs := make([]bson.ObjectID, 0)
		for _, idHex := range *req.TagIDs {
			if objID, err := bson.ObjectIDFromHex(idHex); err == nil {
				tagObjectIDs = append(tagObjectIDs, objID)
			}
		}
		post.TagIDs = tagObjectIDs
	}

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

func (s *PostService) AdminListPosts(ctx context.Context, authorID *bson.ObjectID, status *models.PostStatus, page, limit int64) ([]models.Post, int64, error) {
	return s.postRepo.AdminListPosts(ctx, authorID, status, page, limit)
}

func (s *PostService) GetPostByID(ctx context.Context, postID bson.ObjectID) (*models.Post, error) {
	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		return nil, ErrPostNotFound
	}
	return post, nil
}

func (s *PostService) resolveCategoryIDs(ctx context.Context, slugs []string) ([]bson.ObjectID, error) {
	if len(slugs) == 0 {
		return []bson.ObjectID{}, nil
	}

	// Deduplicate and normalize slugs
	slugMap := make(map[string]struct{})
	cleanSlugs := make([]string, 0, len(slugs))
	for _, raw := range slugs {
		slug := strings.TrimSpace(strings.ToLower(raw))
		if slug != "" {
			if _, exists := slugMap[slug]; !exists {
				slugMap[slug] = struct{}{}
				cleanSlugs = append(cleanSlugs, slug)
			}
		}
	}

	if len(cleanSlugs) == 0 {
		return []bson.ObjectID{}, nil
	}

	categories, err := s.categoryRepo.FindBySlugs(ctx, cleanSlugs)
	if err != nil {
		return nil, err
	}

	// Guard: every requested category slug must exist
	if len(categories) != len(cleanSlugs) {
		return nil, ErrInvalidCategory
	}

	ids := make([]bson.ObjectID, len(categories))
	for i, c := range categories {
		ids[i] = c.ID
	}
	return ids, nil
}

type PaginatedPostsResponse struct {
	Posts      []models.Post    `json:"posts"`
	Category   *models.Category `json:"category"`
	Total      int64            `json:"total"`
	Page       int64            `json:"page"`
	Limit      int64            `json:"limit"`
	TotalPages int64            `json:"totalPages"`
}

func (s *PostService) GetPublishedPostsByCategorySlug(ctx context.Context, slug string, page, limit int64) (*PaginatedPostsResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	skip := (page - 1) * limit

	// 1. Resolve category by slug
	category, err := s.categoryRepo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}

	// 2. Fetch published posts for this category ID
	posts, total, err := s.postRepo.ListPublishedByCategory(ctx, category.ID, limit, skip)
	if err != nil {
		return nil, err
	}

	totalPages := (total + limit - 1) / limit

	return &PaginatedPostsResponse{
		Posts:      posts,
		Category:   category,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}
