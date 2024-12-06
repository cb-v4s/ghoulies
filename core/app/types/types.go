package types

import (
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type FacingDirection int

type UpdateScene struct {
	RoomId string `json:"roomId"`
	Users  []User `json:"users"`
}

// Constants for FacingDirection
const (
	FrontRight FacingDirection = -1
	FrontLeft  FacingDirection = 1
	BackLeft   FacingDirection = 0
	BackRight  FacingDirection = 2

	DefaultDirection        = FrontLeft
	RoomIdFormat     string = "%s#%s" // e.g. "my room#334288"
)

// type Avatars map[int]Avatar
type RoomId string

type User struct {
	UserName  string
	UserID    UserID
	RoomID    string
	Position  Position
	Direction FacingDirection
	IsTyping  bool
}

type Client struct {
	ID       UserID
	RoomId   RoomId
	Username string
	Conn     *websocket.Conn
}

type MessageClient struct {
	Client *Client
	Send   chan []byte
	ConnMu sync.Mutex
}

type Room struct {
	ID       RoomId
	Data     RoomData
	StopChan chan struct{}
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

// type Controllers struct {
// 	User *
// }

type Middlewares struct {
	Auth gin.HandlerFunc
	CSRF gin.HandlerFunc
}

type RoomData struct {
	Name           string
	Password       *string
	Users          []User
	UsersPositions []string // * e.g. "Row, Col" => "1,2", "3,4", ...
	UserIdxMap     map[UserID]UserIdx
}

type UpdateUser struct {
	RoomId   *string `json:"roomId"`
	UserName *string `json:"username"`
	Password *string `json:"password"`
}

type UpdateUserPos struct {
	UserId string `json:"userId"`
	Dest   string `json:"dest"`   // "row,col" => e.g. "3,4", "1,3", ...
	RoomId RoomId `json:"roomId"` // ! TODO: remove this RoomName for security
}

type UpdateUserTyping struct {
	UserId   string `json:"userId"`
	RoomId   string `json:"roomId"`
	IsTyping bool   `json:"isTyping"`
}

type UpdateUserFacingDir struct {
	Dest string `json:"dest"` // "row,col" => e.g. "3,4", "1,3", ...
}

type NewRoom struct {
	UserName string  `json:"userName"`
	RoomName string  `json:"roomName"`
	Password *string `json:"password"`
}

type JoinRoom struct {
	RoomId   RoomId  `json:"roomId"`
	UserName string  `json:"userName"`
	Password *string `json:"password"`
}

type WsPayload struct {
	Event         string      `json:"Event"`
	Authorization string      `json:"Authorization"`
	Data          interface{} `json:"Data"`
}

type Msg struct {
	From   UserID `json:"from"`
	RoomId RoomId `json:"roomId"`
	Msg    string `json:"msg"`
}

type DirectMsg struct {
	Msg      string `json:"msg"`
	ToUserId UserID `json:"userId"`
}

type PopularRoomList struct {
	RoomId     RoomId `json:"roomId"`
	RoomName   string `json:"roomName"`
	TotalConns int    `json:"totalConns"`
}

type ApiResponse map[string]any

func ApiError(err error) ApiResponse {
	return ApiResponse{
		"error": err.Error(),
	}
}
