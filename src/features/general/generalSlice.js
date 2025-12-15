// src/features/general/generalSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  token: null,
  user: null, // Lưu thông tin user (id, name, role...)
  isLoading: false,
};

const generalSlice = createSlice({
  name: 'general',
  initialState,
  reducers: {
    // 1. Action setLogin: Khi đăng nhập thành công
    setLogin: (state, action) => {
      const { token, user } = action.payload;
      state.isLoggedIn = true;
      state.token = token;
      state.user = user;
    },

    // 2. Action logout: Khi đăng xuất
    logout: (state) => {
      state.isLoggedIn = false;
      state.token = null;
      state.user = null;
    },

    // 3. Action cập nhật thông tin user (ví dụ sau khi verify OTP hoặc đổi avatar)
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
});

export const { setLogin, logout, updateUser, setLoading } = generalSlice.actions;
export default generalSlice.reducer;