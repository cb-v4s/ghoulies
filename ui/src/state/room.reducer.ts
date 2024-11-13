import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface DefaultState {
  displayConsole: boolean;
}

const initialState: DefaultState = {
  displayConsole: false,
};

export const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    switchConsoleState: (state) => {
      state.displayConsole = !state.displayConsole;
    },
  },
});

export const { switchConsoleState } = roomSlice.actions;

export const getConsoleState = (state: RootState) => state.room.displayConsole;

export default roomSlice.reducer;
