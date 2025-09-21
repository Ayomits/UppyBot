package dtos

import "time"

type UserBumpQueryDto struct {
	From time.Time `json:"from"`
	To   time.Time `json:"to"`
}
