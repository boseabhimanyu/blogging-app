package services

import (
	"blogging-app/dto"
	"blogging-app/models"
	"blogging-app/repository"
	"context"
	"errors"
	"fmt"
	"strings"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var (
	ErrCategoryNotFound      = errors.New("category not found")
	ErrCategoryAlreadyExists = errors.New("category with this name already exists")
	ErrCategorySlugInUse     = errors.New("category slug already in use")
)

type CategoryService struct {
	categoryRepo repository.CategoryRepository
}

func NewCategoryService(categoryRepo repository.CategoryRepository) *CategoryService {
	return &CategoryService{categoryRepo: categoryRepo}
}

func (s *CategoryService) CreateCategory(ctx context.Context, req dto.CreateCategoryRequest) (*models.Category, error) {
	trimmedName := strings.TrimSpace(req.Name)

	// Check name uniqueness
	existing, err := s.categoryRepo.FindByName(ctx, trimmedName)
	if err == nil && existing != nil {
		return nil, ErrCategoryAlreadyExists
	}
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		return nil, err
	}

	baseSlug := slugify(trimmedName)
	if baseSlug == "" {
		baseSlug = "category"
	}

	uniqueSlug := baseSlug
	counter := 1
	for {
		found, err := s.categoryRepo.FindBySlug(ctx, uniqueSlug)
		if errors.Is(err, mongo.ErrNoDocuments) || found == nil {
			break
		}
		uniqueSlug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++
	}

	cat := &models.Category{
		Name:        trimmedName,
		Slug:        uniqueSlug,
		Description: strings.TrimSpace(req.Description),
	}

	if err := s.categoryRepo.Create(ctx, cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) ListCategories(ctx context.Context) ([]models.Category, error) {
	return s.categoryRepo.List(ctx)
}

func (s *CategoryService) GetCategoryByID(ctx context.Context, id bson.ObjectID) (*models.Category, error) {
	cat, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) UpdateCategory(ctx context.Context, id bson.ObjectID, req dto.UpdateCategoryRequest) (*models.Category, error) {
	cat, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}

	// 1. Update Name (independent of slug)
	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		newName := strings.TrimSpace(*req.Name)
		if !strings.EqualFold(newName, cat.Name) {
			existing, err := s.categoryRepo.FindByName(ctx, newName)
			if err == nil && existing != nil && existing.ID != cat.ID {
				return nil, ErrCategoryAlreadyExists
			}
		}
		cat.Name = newName
	}

	// 2. Update Slug independently
	if req.Slug != nil && strings.TrimSpace(*req.Slug) != "" {
		cleanedSlug := slugify(*req.Slug)
		if cleanedSlug != "" && cleanedSlug != cat.Slug {
			existing, err := s.categoryRepo.FindBySlug(ctx, cleanedSlug)
			if err == nil && existing != nil && existing.ID != cat.ID {
				return nil, ErrCategorySlugInUse
			}
			cat.Slug = cleanedSlug
		}
	}

	// 3. Update Description
	if req.Description != nil {
		cat.Description = strings.TrimSpace(*req.Description)
	}

	if err := s.categoryRepo.Update(ctx, cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) DeleteCategory(ctx context.Context, id bson.ObjectID) error {
	err := s.categoryRepo.Delete(ctx, id)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrCategoryNotFound
		}
		return err
	}
	return nil
}

func (s *CategoryService) GetCategoryBySlug(ctx context.Context, slug string) (*models.Category, error) {
	cat, err := s.categoryRepo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}
	return cat, nil
}
