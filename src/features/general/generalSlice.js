import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  token: null,
  userId: null,
  user: null,
  isLoading: false,
  // Thêm lại currentLocation
  currentLocation: {
    address: null,
    coords: { lat: null, lng: null }
  }
};

const generalSlice = createSlice({
  name: 'general',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      state.isLoggedIn = !!action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLogin: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.userId = action.payload.user?.id; // Lưu luôn ID khi login
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.userId = null;
      state.isLoggedIn = false;
      state.currentLocation = { address: null, coords: { lat: null, lng: null } };
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    // Thêm lại reducer setLocation
    setLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
  },
});

export const { setToken, setUserId, setUser, setLogin, logout, setLoading, setLocation } = generalSlice.actions;

export default generalSlice.reducer;