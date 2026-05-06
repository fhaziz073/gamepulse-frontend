import { createSlice, PayloadAction } from "@reduxjs/toolkit";
type UserInfo = {
  "User ID": string;
  Username: string;
  Email: string;
  "Avatar URL": string;
  "Creation Time": Date;
  "Notification Token": string;
};
interface CounterState {
  userInfo: UserInfo | null;
}
const initialState = {
  isLoggedIn: false,
  userInfo: null,
} as CounterState;
export const stateSlice = createSlice({
  name: "state",
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserInfo | null>) => {
      state.userInfo = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUserInfo } = stateSlice.actions;

export default stateSlice.reducer;
