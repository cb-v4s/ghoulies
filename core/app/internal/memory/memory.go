package memory

import (
	"context"
	"core/config"
	"core/types"
	"core/util"
	"encoding/json"
	"fmt"
	"log"

	redis "github.com/go-redis/redis/v8"
)

var (
	ctx         = context.Background() // ! this is only suitable for simple tests, use context that can be cancelled or has a timeout.
	RedisClient *redis.Client
	clientsKey  = "clients"
	roomsKey    = "rooms"
)

const (
	roomIdFormat      string = "%s#%s" // e.g. my room#334288
	popularRoomsLimit int    = 10
)

func Start() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     config.RedisServer,
		Password: config.RedisPassword,
	})

	// Test Redis connection
	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Fatalf("could not connect to redis::::: %s", err)
		return
	}

	fmt.Println("Connected to Redis successfully.")
}

func AddClient(data *types.Client) {
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
	// Use HDEL to remove the client entry from the hash
	err := RedisClient.HDel(ctx, clientsKey, clientID).Err()
	if err != nil {
		return fmt.Errorf("could not delete client: %w", err)
	}
	return nil
}

func UpdateClientRoom(clientID string, roomId string) error {
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

	err = RedisClient.HSet(ctx, roomsKey, fmt.Sprintf(roomIdFormat, roomName, roomId), roomJson).Err()
	if err != nil {
		log.Fatalf("Error saving room data to Redis: %s", err)
	}
}

func GetRoom(roomId string) (*types.RoomData, bool) {
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
			return nil, fmt.Errorf("failed to get room data: %v", err)
		}

		var roomData types.RoomData
		if err := json.Unmarshal([]byte(roomJSON), &roomData); err != nil {
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

	err = RedisClient.HSet(ctx, roomsKey, roomId, roomJson).Err()
	if err != nil {
		log.Fatalf("Error saving room data to Redis: %s", err)
	}
}

func DeleteRoom(roomID string) error {
	// Use HDEL to remove the room entry from the hash
	err := RedisClient.HDel(ctx, roomsKey, roomID).Err()
	if err != nil {
		return fmt.Errorf("could not delete room: %w", err)
	}
	return nil
}
