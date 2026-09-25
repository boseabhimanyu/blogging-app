package services

import (
	"blogging-app/dto"
	"blogging-app/models"
	"blogging-app/repository"
	"context"
)

type SettingService struct {
	settingRepo repository.SettingRepository
}

func NewSettingService(settingRepo repository.SettingRepository) *SettingService {
	return &SettingService{settingRepo: settingRepo}
}

func (s *SettingService) GetSettings(ctx context.Context) (*models.AppSettings, error) {
	return s.settingRepo.Get(ctx)
}

func (s *SettingService) UpdateSettings(ctx context.Context, req dto.UpdateSettingsRequest) (*models.AppSettings, error) {
	settings, err := s.settingRepo.Get(ctx)
	if err != nil {
		return nil, err
	}

	if req.AllowRegistration != nil {
		settings.AllowRegistration = *req.AllowRegistration
	}

	if err := s.settingRepo.Update(ctx, settings); err != nil {
		return nil, err
	}

	return settings, nil
}
