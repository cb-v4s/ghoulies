export type MessageT = {
  userId: string;
  message: string;
};

export type Todo = {};

export type CoordinatesT = {
  row: number;
  col: number;
};

export enum XAxis {
  Right = 1,
  Left = -1,
}

interface Avatar {
  [XAxis.Right]: string;
  [XAxis.Left]: string;
}

export interface PlayerI {
  userId: string;
  position: CoordinatesT;
  roomId?: string;
  userName: string;
  avatar: Avatar;
  avatarXAxis: XAxis;
}

export interface ApiError {
  error: string;
}

export enum FacingDirection {
  Right = 0,
  Left = 1,
}

export interface RoomInfo {
  roomId: string;
  roomName: string;
  totalConns: number;
}
