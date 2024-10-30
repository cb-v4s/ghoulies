package types

import (
	"core/internal/lib"
)

// XAxis type represents the horizontal axis direction
type XAxis string

// Constants for XAxis
const (
	Right XAxis = "right"
	Left  XAxis = "left"
)

// Avatar struct using XAxis as keys
type Avatar struct {
	Direction map[XAxis]string
}

// Avatars map with integer keys
type Avatars map[int]Avatar

var DefaultAvatars = Avatars{
	1: {
		Direction: map[XAxis]string{
			Right: "1_r.png",
			Left:  "1_l.png",
		},
	},
	2: {
		Direction: map[XAxis]string{
			Right: "2_r.png",
			Left:  "2_l.png",
		},
	},
	3: {
		Direction: map[XAxis]string{
			Right: "3_r.png",
			Left:  "3_l.png",
		},
	},
	4: {
		Direction: map[XAxis]string{
			Right: "4_r.png",
			Left:  "4_l.png",
		},
	},
	5: {
		Direction: map[XAxis]string{
			Right: "5_r.png",
			Left:  "5_l.png",
		},
	},
}

type User struct {
	UserName    string
	UserID      string
	RoomID      string
	Position    lib.Position
	Avatar      Avatar
	AvatarXAxis XAxis
}
