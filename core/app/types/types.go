package types

import (
	"core/internal/lib"

	"github.com/gorilla/websocket"
)

// XAxis type represents the horizontal axis direction
type XAxis string

// Constants for XAxis
const (
	Right        XAxis  = "right"
	Left         XAxis  = "left"
	RoomIdFormat string = "%s#%s" // e.g. "my room#334288"
)

// Avatar struct using XAxis as keys
type Avatar struct {
	Direction map[XAxis]string
}

type Avatars map[int]Avatar
type RoomId string

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
	UserID      UserID
	Connection  *websocket.Conn
	RoomID      string
	Position    lib.Position
	Avatar      Avatar
	AvatarXAxis XAxis
}

type Client struct {
	ID     UserID
	Conn   *websocket.Conn // ! esto probablemente haya que almacenarlo en memoria?
	RoomId RoomId
}

type Room struct {
	Name string
	Id   string
}

type Position struct {
	Row int
	Col int
}

type UserID string
type UserIdx int

type RoomData struct {
	Name           string
	Users          []User
	UsersPositions []string // * e.g. "Row, Col" => "1,2", "3,4", ...
	UserIdxMap     map[UserID]UserIdx
}

type UpdateUserPos struct {
	Dest   string `json:"dest"`   // "row,col" => e.g. "3,4", "1,3", ...
	RoomId RoomId `json:"roomId"` // ! TODO: remove this RoomName for security
}

type UpdateUserFacingDir struct {
	Dest string `json:"dest"` // "row,col" => e.g. "3,4", "1,3", ...
}

type NewRoom struct {
	UserName string `json:"userName"`
	RoomName string `json:"roomName"`
	AvatarId int    `json:"avatarId"`
}

type JoinRoom struct {
	RoomId   RoomId `json:"roomId"`
	UserName string `json:"userName"`
	RoomName string `json:"roomName"`
	AvatarId int    `json:"avatarId"`
}

type WsPayload struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

type Msg struct {
	Msg string `json:"msg"`
}

type DirectMsg struct {
	Msg    string `json:"msg"`
	UserId UserID `json:"userId"`
}

type PopularRoomList struct {
	RoomId     RoomId `json:"roomId"`
	RoomName   string `json:"roomName"`
	TotalConns int    `json:"totalConns"`
}
