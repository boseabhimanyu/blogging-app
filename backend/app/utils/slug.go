package utils

import (
	"regexp"
	"strings"
)

var (
	nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9]+`)
	trailingDashRegex    = regexp.MustCompile(`^-+|-+$`)
)

func GenerateSlug(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))
	// Replace non-alphanumeric characters with hyphens
	slug = nonAlphanumericRegex.ReplaceAllString(slug, "-")
	// Trim leading/trailing hyphens
	slug = trailingDashRegex.ReplaceAllString(slug, "")
	return slug
}
