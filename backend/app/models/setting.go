package models

import "time"

const AppSettingsID = "app_settings"

type AppSettings struct {
	ID                string    `bson:"_id" json:"id"` // Fixed string ID: "app_settings"
	AllowRegistration bool      `bson:"allow_registration" json:"allowRegistration"`
	UpdatedAt         time.Time `bson:"updated_at" json:"updatedAt"`
}

// DefaultSettings returns initial fallback settings if none exist in DB
func DefaultSettings() AppSettings {
	return AppSettings{
		ID:                AppSettingsID,
		AllowRegistration: true, // Registration enabled by default
		UpdatedAt:         time.Now().UTC(),
	}
}
