import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  token: null,
  user: null,
  isLoading: false,
};

const generalSlice = createSlice({
  name: 'general',
  initialState,
  reducers: {
    // Action để lưu Token (Sửa lỗi chưa có setToken)
    setToken: (state, action) => {
      state.token = action.payload;
      state.isLoggedIn = !!action.payload; // Nếu có token -> isLoggedIn = true
    },
    
    // Action để lưu User
    setUser: (state, action) => {
      state.user = action.payload;
    },

    // Action đăng nhập (Lưu cả token và user cùng lúc)
    setLogin: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isLoggedIn = true;
    },

    // Action đăng xuất
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
  },
});

// Xuất các actions ra để các màn hình khác dùng
export const { setToken, setUser, setLogin, logout, setLoading, setLocation } = generalSlice.actions;

// Xuất reducer để store dùng
export default generalSlice.reducer;