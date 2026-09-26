package handler

import (
	"blogging-app/dto"
	"blogging-app/services"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CategoryHandler struct {
	categoryService *services.CategoryService
}

func NewCategoryHandler(categoryService *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

// ListCategories - Public
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	categories, err := h.categoryService.ListCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list categories"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": categories})
}

// GetCategoryByID - Public
func (h *CategoryHandler) GetCategoryByID(c *gin.Context) {
	id, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	cat, err := h.categoryService.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, services.ErrCategoryNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cat})
}

// CreateCategory - Admin Only
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req dto.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat, err := h.categoryService.CreateCategory(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, services.ErrCategoryAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": cat})
}

// UpdateCategory - Admin Only (PATCH)
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	var req dto.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat, err := h.categoryService.UpdateCategory(c.Request.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, services.ErrCategoryAlreadyExists), errors.Is(err, services.ErrCategorySlugInUse):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update category"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cat})
}

// DeleteCategory - Admin Only
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	err = h.categoryService.DeleteCategory(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, services.ErrCategoryNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "category deleted successfully"})
}

// GetCategoryBySlug handles GET /api/v1/categories/:slug
func (h *CategoryHandler) GetCategoryBySlug(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	cat, err := h.categoryService.GetCategoryBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, services.ErrCategoryNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cat})
}
