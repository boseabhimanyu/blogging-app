package dto

import "blogging-app/models"

// UpdateUserProfileRequest contains fields that can be partially updated.
// nil means the field was not provided.
type UpdateUserProfileRequest struct {
	FirstName    *string `json:"firstName"`
	LastName     *string `json:"lastName"`
	Username     *string `json:"username"`
	Email        *string `json:"email"`
	AltEmail     *string `json:"altEmail"`
	Phone        *string `json:"phone"`
	DateOfBirth  *string `json:"dateOfBirth"`
	AddressLine1 *string `json:"addressLine1"`
	AddressLine2 *string `json:"addressLine2"`
	City         *string `json:"city"`
	State        *string `json:"state"`
	PinCode      *string `json:"pinCode"`
}

type ChangeUserPasswordRequest struct {
	NewPassword string `json:"newPassword"`
}

type ListUsersQuery struct {
	Page   int              `form:"page"`
	Limit  int              `form:"limit"`
	Role   *models.UserRole `form:"role"`
	Status *bool            `form:"status"`
	Search string           `form:"search"`
}

type UserListResponse struct {
	Users      []models.User `json:"users"`
	Pagination Pagination    `json:"pagination"`
}

type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"totalPages"`
}

type UserStatusRequest struct {
	Status *bool `json:"status"`
}

type UpdateRoleRequest struct {
	Role models.UserRole `json:"role" binding:"required"`
}
