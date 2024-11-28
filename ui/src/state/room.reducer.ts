import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { RoomState, User } from "../types";
import { isExpired } from "@lib/misc";

const initialState: RoomState = {
  userId: null,
  username: null,
  displayConsole: true,
  isTyping: false,
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
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
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
      const userPosition = state.roomInfo.Users.find(
        ({ UserName }) => UserName === from
      )?.Position;

      if (!userPosition) {
        console.error("setRoomMessage: userPosition not found.");
        return;
      }

      const updatedMessages = [
        ...state.roomInfo.Messages,
        { Msg: msg, From: from, Timestamp: Date.now(), Position: userPosition },
      ];
      state.roomInfo = { ...state.roomInfo, Messages: updatedMessages };
    },
    cleanMessages: (state) => {
      const messagesLength = state.roomInfo.Messages.length;
      if (!messagesLength) return;

      let idxListDelete: number[] = [];

      state.roomInfo.Messages.map(({ Timestamp }, idx: number) => {
        if (isExpired(Timestamp)) idxListDelete.push(idx);
      });

      if (!idxListDelete.length) return;

      const updatedMessages = state.roomInfo.Messages.filter(
        (_, idx: number) => !idxListDelete.includes(idx)
      );

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
  cleanMessages,
  setDefaultState,
  setIsTyping,
} = roomSlice.actions;

export const getConsoleState = (state: RootState) => state.room.displayConsole;
export const getRoomInfo = (state: RootState) => state.room.roomInfo;
export const getUserId = (state: RootState) => state.room.userId;
export const getUsername = (state: RootState) => state.room.username;
export const getMessages = (state: RootState) => state.room.roomInfo.Messages;
export const getIsTyping = (state: RootState) => state.room.isTyping;

export default roomSlice.reducer;
