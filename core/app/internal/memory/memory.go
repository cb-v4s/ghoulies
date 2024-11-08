package memory

import (
	"context"
	"core/config"
	"core/types"
	"core/util"
	"encoding/json"
	"fmt"
	"log"
	"time"

	redis "github.com/go-redis/redis/v8"
)

var (
	RedisClient *redis.Client // TODO: no exponer
)

const (
	roomIdFormat      string = "%s#%s" // e.g. "my room#334288"
	popularRoomsLimit int    = 10
	clientsKey        string = "clients"
	roomsKey          string = "rooms"
)

func NewContextWithTimeout(timeout time.Duration) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

	go func() {
		<-ctx.Done()
		if err := ctx.Err(); err != nil && err == context.DeadlineExceeded {
			fmt.Printf("context deadline exceeded after %v", timeout)
		}
	}()

	return ctx, cancel
}

func New() {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     config.RedisServer,
		Password: config.RedisPassword,
	})

	// Test Redis connection
	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Fatalf("failed to connect to redis: %s", err)
		return
	}

	fmt.Println("Redis connection established")

	// if err := DeleteAllRooms(ctx, "*"); err != nil {
	// 	fmt.Printf("failed to delete all rooms")
	// }

	welcomeRoom := types.RoomData{
		Name:           config.WelcomeRoomName,
		Users:          []types.User{},
		UsersPositions: []string{},
		UserIdxMap:     make(map[types.UserID]types.UserIdx),
	}

	welcomeRoomJSON, err := json.Marshal(welcomeRoom) // ! roomJSON, err := ...
	if err != nil {
		fmt.Printf("Error marshalling client data: %v", err)
	}

	welcomeRoomId := fmt.Sprintf(roomIdFormat, welcomeRoom.Name, "0")

	if roomData, err := RedisClient.HGet(ctx, roomsKey, welcomeRoomId).Result(); err != redis.Nil || len(roomData) == 0 {
		err = RedisClient.HSet(ctx, roomsKey, welcomeRoomId, welcomeRoomJSON).Err()
		if err != nil {
			log.Fatalf("Error saving room data to Redis: %s", err)
		}

		fmt.Println("Welcome room created successfully")
		return
	}
}

func AddClient(data *types.Client) {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	clientJSON, err := json.Marshal(data)
	if err != nil {
		log.Fatalf("Error marshalling client data: %s", err)
	}

	err = RedisClient.HSet(ctx, clientsKey, data.ID, clientJSON).Err()
	if err != nil {
		log.Fatalf("Error saving client data to Redis: %s", err)
	}
}

func GetClient(clientID string) (*types.Client, error) {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	clientJSON, err := RedisClient.HGet(ctx, clientsKey, clientID).Result()
	if err != nil {
		return nil, err
	}

	var client types.Client
	if err := json.Unmarshal([]byte(clientJSON), &client); err != nil {
		return nil, err
	}

	return &client, nil
}

func DeleteClient(clientID string) error {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	// Use HDEL to remove the client entry from the hash
	err := RedisClient.HDel(ctx, clientsKey, clientID).Err()
	if err != nil {
		return fmt.Errorf("could not delete client: %w", err)
	}
	return nil
}

func UpdateClientRoom(clientID string, roomId string) error {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	// Retrieve the existing client data
	clientJSON, err := RedisClient.HGet(ctx, clientsKey, clientID).Result()
	if err != nil {
		return fmt.Errorf("could not get client: %w", err)
	}

	var client types.Client
	if err := json.Unmarshal([]byte(clientJSON), &client); err != nil {
		return fmt.Errorf("could not unmarshal client data: %w", err)
	}

	// Update the RoomId field
	client.RoomId = roomId

	// Marshal the updated client data back to JSON
	updatedClientJSON, err := json.Marshal(client)
	if err != nil {
		return fmt.Errorf("could not marshal updated client data: %w", err)
	}

	// Use HSET to update the client entry in Redis
	err = RedisClient.HSet(ctx, clientsKey, clientID, updatedClientJSON).Err()
	if err != nil {
		return fmt.Errorf("could not update client in Redis: %w", err)
	}

	return nil
}

func CreateRoom(roomName string) {
	roomData := types.RoomData{
		Users:          []types.User{},
		UsersPositions: []string{},
		UserIdxMap:     make(map[types.UserID]types.UserIdx),
	}

	roomJson, err := json.Marshal(roomData)
	if err != nil {
		log.Fatalf("Error marshalling room data: %s", err)
	}

	roomId, err := util.RandomId()
	if err != nil {
		return
	}

	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	err = RedisClient.HSet(ctx, roomsKey, fmt.Sprintf(roomIdFormat, roomName, roomId), roomJson).Err()
	if err != nil {
		log.Fatalf("Error saving room data to Redis: %s", err)
	}
}

func GetRoom(roomId string) (*types.RoomData, bool) {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	roomJSON, err := RedisClient.HGet(ctx, roomsKey, roomId).Result()
	if err != nil {
		return nil, false
	}

	var roomData types.RoomData
	if err := json.Unmarshal([]byte(roomJSON), &roomData); err != nil {
		return nil, false
	}

	return &roomData, true
}

func GetPopularRooms() ([]types.PopularRoomList, error) {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	rooms := []types.PopularRoomList{}
	roomKeys, err := RedisClient.HKeys(ctx, roomsKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get room keys: %v", err)
	}

	totalRooms := len(roomKeys)
	if totalRooms == 0 {
		return rooms, nil
	}

	if totalRooms > popularRoomsLimit {
		roomKeys = roomKeys[:popularRoomsLimit]
	}

	for _, roomKey := range roomKeys {
		roomJSON, err := RedisClient.HGet(ctx, roomsKey, roomKey).Result()
		if err != nil {
			if err == redis.Nil {
				log.Printf("no data found for room key %s", roomKey)
				continue
			}

			return nil, fmt.Errorf("failed to get room data: %v", err)
		}

		if roomJSON == "" {
			log.Printf("room JSON is empty for key %s", roomKey)
			continue
		}

		var roomData types.RoomData
		if err := json.Unmarshal([]byte(roomJSON), &roomData); err != nil {
			fmt.Printf("failed to unmarshal room JSON for key %s: %v", roomKey, err)
			continue
		}

		rooms = append(rooms, types.PopularRoomList{
			RoomId:     roomKey,
			RoomName:   roomData.Name,
			TotalConns: len(roomData.Users),
		})
	}

	return rooms, nil
}

func UpdateRoom(roomId string, newRoomData *types.RoomData) {
	roomJson, err := json.Marshal(newRoomData)
	if err != nil {
		log.Fatalf("Error marshalling room data: %s", err)
	}

	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	err = RedisClient.HSet(ctx, roomsKey, roomId, roomJson).Err()
	if err != nil {
		log.Fatalf("Error saving room data to Redis: %s", err)
	}
}

func DeleteRoom(roomID string) error {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx() // ! cancel ctx to avoid resource leaks

	err := RedisClient.HDel(ctx, roomsKey, roomID).Err()
	if err != nil {
		return fmt.Errorf("could not delete room: %w", err)
	}
	return nil
}

func DeleteAllRooms(ctx context.Context, pattern string) error {
	cursor := uint64(0)

	for {
		keys, newCursor, err := RedisClient.Scan(ctx, cursor, "*", 0).Result()
		if err != nil {
			return fmt.Errorf("could not scan keys: %v", err)
		}

		if len(keys) > 0 {
			_, err = RedisClient.Del(ctx, keys...).Result()
			if err != nil {
				return fmt.Errorf("could not delete keys: %v", err)
			}
			fmt.Printf("Deleted %d keys.\n", len(keys))
		}

		cursor = newCursor
		if cursor == 0 {
			break
		}
	}

	return nil
}
