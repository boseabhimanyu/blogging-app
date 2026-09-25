package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Category struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string        `bson:"name" json:"name"`               // e.g. "Software Engineering"
	Slug        string        `bson:"slug" json:"slug"`               // e.g. "software-engineering"
	Description string        `bson:"description" json:"description"` // Optional
	CreatedAt   time.Time     `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updatedAt"`
}
