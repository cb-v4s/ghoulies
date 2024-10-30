import { api } from "./lib/api";
import { Todo } from "./types";

export const fetchRooms = async (): Promise<Todo> => {
    const { rooms } = (await api.get("/rooms")).data as any;
    return rooms;
  };