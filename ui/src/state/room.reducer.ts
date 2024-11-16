import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

type Position = {
  Row: number;
  Col: number;
};

type User = {
  Position: Position;
  RoomID: string;
  UserID: string;
  Username: string;
};

interface Room {
  RoomId: string | null;
  Users: User[];
}

interface RoomState {
  displayConsole: boolean;
  roomInfo: Room;
  userId: string | null;
}

const initialState: RoomState = {
  userId: null,
  displayConsole: false,
  roomInfo: {
    RoomId: null,
    Users: [],
  },
};

export const roomSlice = createSlice({
  name: "scenario",
  initialState,
  reducers: {
    switchConsoleState: (state) => {
      state.displayConsole = !state.displayConsole;
    },
    setRoomInfo: (state, action: PayloadAction<any>) => {
      const { roomId, users } = action.payload;
      console.log("updating roomInfo ------------------------", users);
      state.roomInfo = { RoomId: roomId, Users: users };
    },
    setUserId: (state, action: PayloadAction<any>) => {
      const { userId } = action.payload;
      console.log("UserId from setUser action: ", userId, action.payload);
      state.userId = userId;
    },
  },
});

export const { switchConsoleState, setRoomInfo, setUserId } = roomSlice.actions;

export const getConsoleState = (state: RootState) => state.room.displayConsole;
export const getRoomInfo = (state: RootState) => state.room.roomInfo;
export const getUserId = (state: RootState) => state.room.userId;

export default roomSlice.reducer;
