package handler

import (
	"errors"
	"net/http"
	"strings"

	"blogging-app/dto"
	"blogging-app/services"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(
	userService *services.UserService,
) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

func (h *UserHandler) Me(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	user, err := h.userService.GetMe(
		c.Request.Context(),
		userID,
	)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "unable to fetch user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	var req dto.UpdateUserProfileRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	user, err := h.userService.UpdateProfile(
		c.Request.Context(),
		userID,
		&req,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})

		case errors.Is(err, services.ErrEmailAlreadyExists),
			errors.Is(err, services.ErrAltEmailAlreadyExists),
			errors.Is(err, services.ErrUsernameAlreadyExists),
			errors.Is(err, services.ErrPhoneAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"error": err.Error(),
			})

		case errors.Is(err, services.ErrAltEmailSameAsEmail),
			errors.Is(err, services.ErrNoFieldsToUpdate):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		}

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "profile updated successfully",
		"user":    user,
	})
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	user, err := h.userService.CreateUser(
		c.Request.Context(),
		&req,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrEmailAlreadyExists),
			errors.Is(err, services.ErrAltEmailAlreadyExists),
			errors.Is(err, services.ErrUsernameAlreadyExists),
			errors.Is(err, services.ErrPhoneAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"error": err.Error(),
			})

		case errors.Is(err, services.ErrAltEmailSameAsEmail):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		default:
			// Validation errors reach here.
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		}

		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "customer created successfully",
		"user":    user,
	})
}

func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	customerID := c.Param("id")

	var req dto.UpdateUserProfileRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	user, err := h.userService.UpdateUserProfile(
		c.Request.Context(),
		customerID,
		&req,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		case errors.Is(err, services.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "customer not found",
			})

		case errors.Is(err, services.ErrInvalidUserRole):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "target user is not a customer",
			})

		case errors.Is(err, services.ErrEmailAlreadyExists),
			errors.Is(err, services.ErrAltEmailAlreadyExists),
			errors.Is(err, services.ErrUsernameAlreadyExists),
			errors.Is(err, services.ErrPhoneAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"error": err.Error(),
			})

		case errors.Is(err, services.ErrAltEmailSameAsEmail),
			errors.Is(err, services.ErrNoFieldsToUpdate):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		}

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "customer updated successfully",
		"user":    user,
	})
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	allowedParams := map[string]bool{
		"page":   true,
		"limit":  true,
		"search": true,
		"status": true,
		"role":   true,
	}

	for key := range c.Request.URL.Query() {
		if !allowedParams[key] {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid query parameter: " + key,
			})
			return
		}
	}

	var query dto.ListUsersQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid query parameters",
		})
		return
	}

	hasRole := query.Role != nil && strings.TrimSpace(string(*query.Role)) != ""

	if strings.TrimSpace(query.Search) == "" && query.Status == nil && !hasRole {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "at least one filter (search, status, or role) must be provided",
		})
		return
	}

	result, err := h.userService.ListUsers(
		c.Request.Context(),
		query,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidPage),
			errors.Is(err, services.ErrInvalidLimit):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "unable to fetch users",
			})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *UserHandler) GetUserByID(c *gin.Context) {
	customerID := c.Param("id")

	user, err := h.userService.GetUserByID(
		c.Request.Context(),
		customerID,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		case errors.Is(err, services.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "customer not found",
			})

		case errors.Is(err, services.ErrInvalidUserRole):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "target user is not a customer",
			})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "unable to fetch customer",
			})
		}

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customer": user,
	})
}

func (h *UserHandler) UpdateUserStatus(c *gin.Context) {
	adminID := c.GetString("userID")
	targetUserID := strings.TrimSpace(c.Param("id"))

	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user id is required",
		})
		return
	}

	var req dto.UserStatusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	if req.Status == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "status is required",
		})
		return
	}

	err := h.userService.UserStatus(
		c.Request.Context(),
		adminID,
		targetUserID,
		*req.Status,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})

		case errors.Is(err, services.ErrCannotChangeOwnStatus):
			c.JSON(http.StatusForbidden, gin.H{
				"error": "you cannot change your own account status",
			})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user status updated successfully",
		"status":  *req.Status,
	})
}
func (h *UserHandler) ChangeUserPassword(c *gin.Context) {
	userID := strings.TrimSpace(c.Param("id"))
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user id is required",
		})
		return
	}

	var req dto.ChangeUserPasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	if err := h.userService.ChangeUserPassword(
		c.Request.Context(),
		userID,
		&req,
	); err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})

		case errors.Is(err, services.ErrInvalidUserID):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid user id",
			})

		case errors.Is(err, services.ErrInvalidUserRole):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "password can only be reset for customer users",
			})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
		}

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user password changed successfully",
	})
}

func (h *UserHandler) UpdateProfilePic(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
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

	files := c.Request.MultipartForm.File["profile_pic"]

	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "profile picture is required",
		})
		return
	}

	if len(files) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "only one profile picture can be uploaded at a time",
		})
		return
	}

	fileHeader := files[0]

	if err := h.userService.UpdateProfilePic(
		c.Request.Context(),
		userID,
		fileHeader,
	); err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		case errors.Is(err, services.ErrInvalidUserRole):
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
		"message": "profile picture updated successfully",
	})
}

func (h *UserHandler) UpdateRole(c *gin.Context) {
	adminID := c.GetString("userID")
	targetUserID := strings.TrimSpace(c.Param("id"))

	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user id is required",
		})
		return
	}

	var req dto.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body or missing role",
		})
		return
	}

	err := h.userService.UpdateRole(
		c.Request.Context(),
		adminID,
		targetUserID,
		req.Role,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})

		case errors.Is(err, services.ErrInvalidUserRole):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid user role provided",
			})

		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user role updated successfully",
		"role":    req.Role,
	})
}
