import { api } from "./lib/api";
import { RoomInfo } from "./types";

export const fetchRooms = async (): Promise<RoomInfo[]> => {
  const rooms: RoomInfo[] = ((await api.get("/rooms")).data as any).rooms;
  return rooms;
};
