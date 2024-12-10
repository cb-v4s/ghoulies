export type MessageT = {
  userId: string;
  message: string;
};

export type Todo = {};

export type MapOffset = {
  x: number;
  y: number;
};

export type CanvasDimensions = {
  width: number;
  height: number;
};

export interface PopularRoomsResponse {
  rooms: RoomInfo[];
}

type UserProfile = {
  userId: string;
  email: string;
  username: string;
  createdAt: number;
};

export interface UserProfileResponse {
  user: UserProfile;
}

export interface RoomInfo {
  roomId: string;
  roomName: string;
  totalConns: number;
  isProtected: boolean;
}

export type Position = {
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

export interface Room {
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
  updateQueue: any[];
  isUpdating: boolean;
}
