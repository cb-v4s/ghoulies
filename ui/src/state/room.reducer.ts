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
  Users: User[];
}

interface DefaultState {
  displayConsole: boolean;
  roomInfo: Room;
}

const initialState: DefaultState = {
  displayConsole: false,
  roomInfo: {
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
      const { Users } = action.payload;
      console.log("updating roomInfo ------------------------", Users);
      state.roomInfo = { Users: Users };
    },
  },
});

export const { switchConsoleState, setRoomInfo } = roomSlice.actions;

export const getConsoleState = (state: RootState) => state.room.displayConsole;
export const getRoomInfo = (state: RootState) => state.room.roomInfo;

export default roomSlice.reducer;
