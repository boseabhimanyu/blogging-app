package handler

import (
	"blogging-app/dto"
	"blogging-app/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SettingHandler struct {
	settingService *services.SettingService
}

func NewSettingHandler(settingService *services.SettingService) *SettingHandler {
	return &SettingHandler{settingService: settingService}
}

// GetSettings - Public or Admin endpoint to inspect current app flags
func (h *SettingHandler) GetSettings(c *gin.Context) {
	settings, err := h.settingService.GetSettings(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve settings"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": settings})
}

// UpdateSettings - Strictly Admin-only PATCH
func (h *SettingHandler) UpdateSettings(c *gin.Context) {
	var req dto.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings, err := h.settingService.UpdateSettings(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": settings})
}
