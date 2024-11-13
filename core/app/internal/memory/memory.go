package memory

import (
	"context"
	"core/config"
	"core/types"
	"encoding/json"
	"fmt"
	"log"
	"time"

	redis "github.com/go-redis/redis/v8"
)

var (
	redisClient *redis.Client
)

const (
	popularRoomsLimit int    = 10
	clientsKey        string = "clients"
	roomsKey          string = "rooms"
)

// ! call `defer cancel()` on each func call to avoid resource leaks
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
	defer cancelCtx()

	redisClient = redis.NewClient(&redis.Options{
		Addr:     config.RedisServer,
		Password: config.RedisPassword,
	})

	// Test Redis connection
	if err := redisClient.Ping(ctx).Err(); err != nil {
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

	welcomeRoomJSON, err := json.Marshal(welcomeRoom)
	if err != nil {
		fmt.Printf("Error marshalling client data: %v", err)
	}

	welcomeRoomId := fmt.Sprintf(types.RoomIdFormat, welcomeRoom.Name, "0")

	if roomData, err := redisClient.HGet(ctx, roomsKey, welcomeRoomId).Result(); err != redis.Nil || len(roomData) == 0 {
		err = redisClient.HSet(ctx, roomsKey, welcomeRoomId, welcomeRoomJSON).Err()
		if err != nil {
			log.Fatalf("Error saving room data to Redis: %s", err)
		}

		fmt.Println("Welcome room created successfully")
		return
	}
}

func AddClient(data *types.Client) {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	clientJSON, err := json.Marshal(data)
	if err != nil {
		log.Fatalf("Error marshalling client data: %s", err)
	}

	err = redisClient.HSet(ctx, clientsKey, data.ID, clientJSON).Err()
	if err != nil {
		log.Fatalf("Error saving client data to Redis: %s", err)
	}
}

func GetClient(clientID types.UserID) (*types.Client, error) {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	clientJSON, err := redisClient.HGet(ctx, clientsKey, string(clientID)).Result()
	if err != nil {
		return nil, err
	}

	var client types.Client
	if err := json.Unmarshal([]byte(clientJSON), &client); err != nil {
		return nil, err
	}

	return &client, nil
}

func DeleteClient(clientID types.UserID) error {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	// Use HDEL to remove the client entry from the hash
	err := redisClient.HDel(ctx, clientsKey, string(clientID)).Err()
	if err != nil {
		return fmt.Errorf("could not delete client: %w", err)
	}
	return nil
}

func UpdateUserRoom(clientID types.UserID, roomId types.RoomId) error {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	// Retrieve the existing client data
	clientJSON, err := redisClient.HGet(ctx, clientsKey, string(clientID)).Result()
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
	err = redisClient.HSet(ctx, clientsKey, clientID, updatedClientJSON).Err()
	if err != nil {
		return fmt.Errorf("could not update client in Redis: %w", err)
	}

	return nil
}

func CreateRoom(roomName string, roomId types.RoomId, roomData types.RoomData) {
	roomJson, err := json.Marshal(roomData)
	if err != nil {
		log.Fatalf("Error marshalling room data: %s", err)
	}

	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	err = redisClient.HSet(ctx, roomsKey, roomId, roomJson).Err()
	if err != nil {
		log.Fatalf("Error saving room data to Redis: %s", err)
	}
}

func GetRoom(roomId types.RoomId) (*types.RoomData, bool) {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	roomJSON, err := redisClient.HGet(ctx, roomsKey, string(roomId)).Result()
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
	defer cancelCtx()

	rooms := []types.PopularRoomList{}
	roomIds, err := redisClient.HKeys(ctx, roomsKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get room keys: %v", err)
	}

	totalRooms := len(roomIds)
	if totalRooms == 0 {
		return rooms, nil
	}

	if totalRooms > popularRoomsLimit {
		roomIds = roomIds[:popularRoomsLimit]
	}

	for _, roomId := range roomIds {
		roomJSON, err := redisClient.HGet(ctx, roomsKey, roomId).Result()
		if err != nil {
			if err == redis.Nil {
				log.Printf("no data found for room key %s", roomId)
				continue
			}

			return nil, fmt.Errorf("failed to get room data: %v", err)
		}

		if roomJSON == "" {
			log.Printf("room JSON is empty for key %s", roomId)
			continue
		}

		var roomData types.RoomData
		if err := json.Unmarshal([]byte(roomJSON), &roomData); err != nil {
			fmt.Printf("failed to unmarshal room JSON for key %s: %v", roomId, err)
			continue
		}

		rooms = append(rooms, types.PopularRoomList{
			RoomId:     types.RoomId(roomId),
			RoomDesc:   "Qui nisi nostrud nostrud irure incididunt culpa ullamco.",
			RoomName:   roomData.Name,
			TotalConns: len(roomData.Users),
		})
	}

	return rooms, nil
}

func UpdateRoom(roomId types.RoomId, newRoomData *types.RoomData) {
	roomJson, err := json.Marshal(newRoomData)
	if err != nil {
		log.Fatalf("Error marshalling room data: %s", err)
	}

	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	err = redisClient.HSet(ctx, roomsKey, roomId, roomJson).Err()
	if err != nil {
		log.Fatalf("Error saving room data to Redis: %s", err)
	}
}

func DeleteRoom(roomId types.RoomId) error {
	ctx, cancelCtx := NewContextWithTimeout(10 * time.Second)
	defer cancelCtx()

	err := redisClient.HDel(ctx, roomsKey, string(roomId)).Err()
	if err != nil {
		return fmt.Errorf("could not delete room: %w", err)
	}
	return nil
}

func DeleteAllRooms(ctx context.Context, pattern string) error {
	cursor := uint64(0)

	for {
		keys, newCursor, err := redisClient.Scan(ctx, cursor, "*", 0).Result()
		if err != nil {
			return fmt.Errorf("could not scan keys: %v", err)
		}

		if len(keys) > 0 {
			_, err = redisClient.Del(ctx, keys...).Result()
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
