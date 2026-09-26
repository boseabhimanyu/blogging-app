package handler

import (
	"blogging-app/dto"
	"blogging-app/models"
	"blogging-app/services"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type PostHandler struct {
	postService *services.PostService
}

func NewPostHandler(postService *services.PostService) *PostHandler {
	return &PostHandler{
		postService: postService,
	}
}

// CreatePost - POST /api/v1/posts (Auth required)
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req dto.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, role, err := getUserContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	post, err := h.postService.CreatePost(c.Request.Context(), userID, role, req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUnauthorizedPublish):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})

		case errors.Is(err, services.ErrInvalidCategory),
			errors.Is(err, services.ErrInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create post"})
		}
		return
	}

	c.JSON(http.StatusCreated, post)
}

// UpdatePost - PATCH /api/v1/posts/:id (Auth required)
func (h *PostHandler) UpdatePost(c *gin.Context) {
	postIDHex := c.Param("id")
	postID, err := bson.ObjectIDFromHex(postIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var req dto.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, role, err := getUserContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	post, err := h.postService.UpdatePost(c.Request.Context(), postID, userID, role, req)
	if err != nil {
		switch {
		// 404 Not Found
		case errors.Is(err, services.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

		// 403 Forbidden
		case errors.Is(err, services.ErrForbidden),
			errors.Is(err, services.ErrUnauthorizedPublish):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})

		// 409 Conflict (Slug collision)
		case errors.Is(err, services.ErrSlugAlreadyInUse):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

		// 400 Bad Request (Invalid Category, Bad Status, etc.)
		case errors.Is(err, services.ErrInvalidCategory),
			errors.Is(err, services.ErrInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		// 500 Internal Server Error (Actual unexpected system errors)
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update post"})
		}
		return
	}

	c.JSON(http.StatusOK, post)
}

// DeletePost - DELETE /api/v1/posts/:id (Auth required)
func (h *PostHandler) DeletePost(c *gin.Context) {
	postIDHex := c.Param("id")
	postID, err := bson.ObjectIDFromHex(postIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	userID, role, err := getUserContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err = h.postService.DeletePost(c.Request.Context(), postID, userID, role)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, services.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete post"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "post deleted successfully"})
}

// ListPublished - GET /api/v1/posts (Public feed)
func (h *PostHandler) ListPublished(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)

	var categoryID *bson.ObjectID
	if catParam := c.Query("categoryId"); catParam != "" {
		if id, err := bson.ObjectIDFromHex(catParam); err == nil {
			categoryID = &id
		}
	}

	var tagID *bson.ObjectID
	if tagParam := c.Query("tagId"); tagParam != "" {
		if id, err := bson.ObjectIDFromHex(tagParam); err == nil {
			tagID = &id
		}
	}

	posts, total, err := h.postService.ListPublished(c.Request.Context(), categoryID, tagID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  posts,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

// ListMyPosts - GET /api/v1/posts/me (Auth required: author's drafts and posts)
func (h *PostHandler) ListMyPosts(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)

	userID, _, err := getUserContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	posts, total, err := h.postService.ListAuthorPosts(c.Request.Context(), userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch your posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  posts,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

// Helper to pull userID and role safely from Gin context (set by your AuthMiddleware)
func getUserContext(c *gin.Context) (bson.ObjectID, models.UserRole, error) {
	// 1. Try common ID keys
	valID, existsID := c.Get("userID")
	if !existsID {
		valID, existsID = c.Get("userId")
	}
	if !existsID {
		return bson.NilObjectID, "", errors.New("missing user id in context")
	}

	// 2. Convert ID whether it was stored as bson.ObjectID or string
	var userID bson.ObjectID
	switch v := valID.(type) {
	case bson.ObjectID:
		userID = v
	case string:
		var err error
		userID, err = bson.ObjectIDFromHex(v)
		if err != nil {
			return bson.NilObjectID, "", errors.New("invalid user id format")
		}
	default:
		return bson.NilObjectID, "", errors.New("unsupported user id type")
	}

	// 3. Try common Role keys
	valRole, existsRole := c.Get("userRole")
	if !existsRole {
		valRole, existsRole = c.Get("role")
	}
	if !existsRole {
		return bson.NilObjectID, "", errors.New("missing role in context")
	}

	// 4. Convert Role whether it was stored as models.UserRole or string
	var role models.UserRole
	switch v := valRole.(type) {
	case models.UserRole:
		role = v
	case string:
		role = models.UserRole(v)
	default:
		return bson.NilObjectID, "", errors.New("unsupported role type")
	}

	return userID, role, nil
}

func (h *PostHandler) AdminListPosts(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)

	var authorID *bson.ObjectID
	if authorParam := c.Query("authorId"); authorParam != "" {
		if id, err := bson.ObjectIDFromHex(authorParam); err == nil {
			authorID = &id
		}
	}

	var status *models.PostStatus
	if statusParam := c.Query("status"); statusParam != "" {
		s := models.PostStatus(statusParam)
		status = &s
	}

	posts, total, err := h.postService.AdminListPosts(c.Request.Context(), authorID, status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  posts,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

// GetPostBySlug handles GET /api/v1/posts/:slug
// Public for published posts; authors and admins can preview drafts via optional auth.
func (h *PostHandler) GetPostBySlug(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	// Try extracting auth context if present (optional auth)
	var viewerID *bson.ObjectID
	var viewerRole *models.UserRole

	if uid, role, err := getUserContext(c); err == nil {
		viewerID = &uid
		viewerRole = &role
	}

	post, err := h.postService.GetPostBySlug(c.Request.Context(), slug, viewerID, viewerRole)
	if err != nil {
		if errors.Is(err, services.ErrPostNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// AdminGetPostByID handles GET /api/v1/admin/posts/:id
// Accessible strictly by Admins to fetch any post by MongoDB ObjectID.
func (h *PostHandler) AdminGetPostByID(c *gin.Context) {
	idParam := c.Param("id")
	postID, err := bson.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	post, err := h.postService.GetPostByID(c.Request.Context(), postID)
	if err != nil {
		if errors.Is(err, services.ErrPostNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// GetPostsByCategory handles GET /api/v1/categories/:slug/posts
func (h *PostHandler) GetPostsByCategory(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category slug is required"})
		return
	}

	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)

	res, err := h.postService.GetPublishedPostsByCategorySlug(c.Request.Context(), slug, page, limit)
	if err != nil {
		if errors.Is(err, services.ErrCategoryNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch posts for category"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *PostHandler) UpdateCoverImage(c *gin.Context) {
	postID := c.Param("id")
	if strings.TrimSpace(postID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "post id is required",
		})
		return
	}

	userID, role, err := getUserContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid multipart form",
		})
		return
	}

	files := c.Request.MultipartForm.File["cover_image"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "cover image is required",
		})
		return
	}

	if len(files) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "only one cover image can be uploaded at a time",
		})
		return
	}

	fileHeader := files[0]

	if err := h.postService.UpdateCoverImage(
		c.Request.Context(),
		postID,
		userID.Hex(),
		role,
		fileHeader,
	); err != nil {
		switch {
		case errors.Is(err, services.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, services.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{
				"error": err.Error(),
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "cover image updated successfully",
	})
}
