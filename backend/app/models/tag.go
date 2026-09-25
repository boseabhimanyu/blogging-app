package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Tag struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string        `bson:"name" json:"name"`               // Display name, e.g. "Go Programming"
	Slug        string        `bson:"slug" json:"slug"`               // Unique identifier, e.g. "go-programming"
	Description string        `bson:"description" json:"description"` // Optional metadata
	CreatedBy   bson.ObjectID `bson:"created_by" json:"createdBy"`    // Admin or Publisher who created it
	CreatedAt   time.Time     `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updatedAt"`
}
