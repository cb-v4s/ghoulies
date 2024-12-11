export interface WsResponseData {
  Event: string;
  Data: any;
}

export enum RequestEvents {
  CreateRoom = "newRoom",
  JoinRoom = "joinRoom",
  UpdatePosition = "updatePosition",
  UpdateTyping = "updateTyping",
  BroadcastMessage = "broadcastMessage",
  LeaveRoom = "leaveRoom",
}

export enum ResponseEvents {
  UpdateScene = "updateScene",
  UpdateUserPosition = "updateUser",
  BroadcastMessage = "broadcastMessage",
  JoinRoomSuccess = "joinRoomSuccess",

  // webrtc
  JoinCall = "joinCall",
  Offer = "offer",
  Answer = "answer",
  IceCandidate = "iceCandidate",
}

export interface JoinRoomData {
  roomId: string;
  userName: string;
  password?: string;
}

export interface BroadcastMessageData {
  roomId: string;
  msg: string;
  from: string;
}

export interface NewRoomData {
  roomName: string;
  userName: string;
  password?: string;
}

export interface LeaveRoomData {
  userId: string;
}

export interface UpdatePositionData {
  dest: string;
  roomId: string;
  userId: string;
}

export interface UpdateTyping {
  roomId: string;
  userId: string;
  isTyping: boolean;
}
