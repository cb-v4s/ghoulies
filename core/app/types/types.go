package types

import (
	"core/internal/lib"
	"sync"

	"github.com/gorilla/websocket"
)

// XAxis type represents the horizontal axis direction
type XAxis int

// Constants for XAxis
const (
	Right            XAxis  = 1
	Left             XAxis  = -1
	DefaultDirection        = Left
	RoomIdFormat     string = "%s#%s" // e.g. "my room#334288"
)

// type Avatars map[int]Avatar
type RoomId string

type User struct {
	UserName  string
	UserID    UserID
	RoomID    string
	Position  lib.Position
	Direction XAxis
}

type Client struct {
	ID       UserID
	RoomId   RoomId
	Username string
	Conn     *websocket.Conn
	ConnMu   sync.Mutex
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

type UserLeave struct {
	UserId string `json:"userId"`
}

type RoomData struct {
	Name           string
	Users          []User
	UsersPositions []string // * e.g. "Row, Col" => "1,2", "3,4", ...
	UserIdxMap     map[UserID]UserIdx
}

type UpdateUserPos struct {
	UserId string `json:"userId"`
	Dest   string `json:"dest"`   // "row,col" => e.g. "3,4", "1,3", ...
	RoomId RoomId `json:"roomId"` // ! TODO: remove this RoomName for security
}

type UpdateUserFacingDir struct {
	Dest string `json:"dest"` // "row,col" => e.g. "3,4", "1,3", ...
}

type NewRoom struct {
	UserName string `json:"userName"`
	RoomName string `json:"roomName"`
}

type JoinRoom struct {
	RoomId   RoomId `json:"roomId"`
	UserName string `json:"userName"`
}

type WsPayload struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

type Msg struct {
	From   UserID `json:"from"`
	RoomId RoomId `json:"roomId"`
	Msg    string `json:"msg"`
	Pos    string `json:"pos"`
}

type DirectMsg struct {
	Msg      string `json:"msg"`
	ToUserId UserID `json:"userId"`
}

type PopularRoomList struct {
	RoomId     RoomId `json:"roomId"`
	RoomName   string `json:"roomName"`
	RoomDesc   string `json:"roomDesc"` // rooms description
	TotalConns int    `json:"totalConns"`
}
