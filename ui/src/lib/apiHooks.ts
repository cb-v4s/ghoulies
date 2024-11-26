import { api } from "./api";
import { RoomInfo } from "../types";

export const fetchRooms = async (): Promise<RoomInfo[]> => {
  const rooms: RoomInfo[] = ((await api.get("/rooms")).data as any).rooms;
  return rooms;
};
