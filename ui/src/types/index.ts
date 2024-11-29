export type MessageT = {
  userId: string;
  message: string;
};

export type Todo = {};

// TODO: rm this
export interface ApiError {
  error: string;
}

export interface PopularRoomsResponse {
  rooms: RoomInfo[];
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
  frontRight = -1,
  frontLeft = 1,
  backLeft = 0,
  backRight = 2,
}

export type User = {
  Position: Position;
  Direction: FacingDirection;
  RoomID: string;
  UserID: string;
  UserName: string;
  IsTyping: boolean;
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
  isTyping: boolean | null;
}
