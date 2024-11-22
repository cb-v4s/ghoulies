export type MessageT = {
  userId: string;
  message: string;
};

export type Todo = {};

export interface ApiError {
  error: string;
}

export interface RoomInfo {
  roomId: string;
  roomName: string;
  totalConns: number;
}

type Position = {
  Row: number;
  Col: number;
};

export enum FacingDirection {
  Right = 1,
  Left = -1,
}

export type User = {
  Position: Position;
  Direction: FacingDirection;
  RoomID: string;
  UserID: string;
  UserName: string;
};

export type Message = {
  Msg: string;
  From: string;
  Timestamp: number;
  Position: Position;
};

interface Room {
  RoomId: string | null;
  Users: User[];
  Messages: Message[];
}

export interface RoomState {
  displayConsole: boolean;
  roomInfo: Room;
  userId: string | null;
  username: string | null;
}
