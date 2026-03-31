import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface CounterState {
  isLoggedIn: boolean;
  notifToken: null | string;
}
const initialState = {
  isLoggedIn: false,
  notifToken: null,
} as CounterState;
export const stateSlice = createSlice({
  name: "state",
  initialState,
  reducers: {
    changeLoginStatus: (state) => {
      state.isLoggedIn = !state.isLoggedIn;
    },
    setNotifToken: (state, action: PayloadAction<string | null>) => {
      state.notifToken = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { changeLoginStatus, setNotifToken } = stateSlice.actions;

export default stateSlice.reducer;
