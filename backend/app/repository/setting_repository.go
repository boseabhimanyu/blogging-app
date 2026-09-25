package repository

import (
	"context"

	"blogging-app/models"
)

type SettingRepository interface {
	Get(ctx context.Context) (*models.AppSettings, error)
	Update(ctx context.Context, settings *models.AppSettings) error
}
