import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { RoomState, User } from "../types";

const initialState: RoomState = {
  userId: null,
  username: null,
  displayConsole: false,
  roomInfo: {
    RoomId: null,
    Users: [],
    Messages: [],
  },
};

export const roomSlice = createSlice({
  name: "scenario",
  initialState,
  reducers: {
    switchConsoleState: (state) => {
      state.displayConsole = !state.displayConsole;
    },
    setRoomInfo: (
      state,
      action: PayloadAction<{ roomId: string; users: User[] }>
    ) => {
      const { roomId, users } = action.payload;
      state.roomInfo = { ...state.roomInfo, RoomId: roomId, Users: users };
    },
    setUserId: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      state.userId = userId;
    },
    setUsername: (state, action: PayloadAction<{ username: string }>) => {
      const { username } = action.payload;
      state.username = username;
    },
    setRoomMessage: (
      state,
      action: PayloadAction<{ msg: string; from: string }>
    ) => {
      const { msg, from } = action.payload;
      const updatedMessages = [
        ...state.roomInfo.Messages,
        { Msg: msg, From: from },
      ];
      state.roomInfo = { ...state.roomInfo, Messages: updatedMessages };
    },
    removeFirstMessage: (state) => {
      const messagesLength = state.roomInfo.Messages.length;
      if (!messagesLength) return;

      const updatedMessages = state.roomInfo.Messages.slice(1, messagesLength);
      state.roomInfo.Messages = updatedMessages;
    },
    setDefaultState: (state) => {
      state.userId = null;
      state.username = null;
      state.displayConsole = false;
      state.roomInfo = {
        RoomId: null,
        Users: [],
        Messages: [],
      };
    },
  },
});

export const {
  switchConsoleState,
  setRoomInfo,
  setUserId,
  setRoomMessage,
  setUsername,
  removeFirstMessage,
  setDefaultState,
} = roomSlice.actions;

export const getConsoleState = (state: RootState) => state.room.displayConsole;
export const getRoomInfo = (state: RootState) => state.room.roomInfo;
export const getUserId = (state: RootState) => state.room.userId;
export const getUsername = (state: RootState) => state.room.username;
export const getMessages = (state: RootState) => state.room.roomInfo.Messages;

export default roomSlice.reducer;
