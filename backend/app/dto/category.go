package dto

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=50"`
	Description string `json:"description" binding:"max=250"`
}

type UpdateCategoryRequest struct {
	Name        *string `json:"name" binding:"omitempty,min=2,max=50"`
	Slug        *string `json:"slug" binding:"omitempty,min=2,max=60"`
	Description *string `json:"description" binding:"omitempty,max=250"`
}
