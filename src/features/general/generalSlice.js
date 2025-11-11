import { createSlice } from '@reduxjs/toolkit';

const initialState = { token: null, user: null };

const generalSlice = createSlice({
  name: 'generalState',
  initialState,
  reducers: {
    setToken: (state, action) => { state.token = action.payload; },
    clearToken: (state) => { state.token = null; },
  },
});

export const { setToken, clearToken } = generalSlice.actions;
export default generalSlice.reducer;
