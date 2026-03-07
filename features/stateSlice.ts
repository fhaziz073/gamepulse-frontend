import { createSlice } from "@reduxjs/toolkit";

export const stateSlice = createSlice({
  name: "state",
  initialState: {
    isLoggedIn: false,
  },
  reducers: {
    changeLoginStatus: (state) => {
      state.isLoggedIn = !state.isLoggedIn;
    },
  },
});

// Action creators are generated for each case reducer function
export const { changeLoginStatus } = stateSlice.actions;

export default stateSlice.reducer;
