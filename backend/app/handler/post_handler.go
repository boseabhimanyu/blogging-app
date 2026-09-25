package handler

import (
	"blogging-app/dto"
	"blogging-app/models"
	"blogging-app/services"
	"errors"
	"net/http"
	"strconv"

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
		if errors.Is(err, services.ErrUnauthorizedPublish) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create post"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

// GetPostBySlug - GET /api/v1/posts/:slug (Public, but previews drafts if author/admin is logged in)
func (h *PostHandler) GetPostBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	var viewerID *bson.ObjectID
	var viewerRole *models.UserRole

	// Attempt to pull user info if authenticated, but don't fail if anonymous
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

	c.JSON(http.StatusOK, post)
}

// UpdatePost - PUT /api/v1/posts/:id (Auth required)
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
		case errors.Is(err, services.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, services.ErrForbidden) || errors.Is(err, services.ErrUnauthorizedPublish):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Slug already in use"})
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
