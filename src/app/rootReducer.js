import { combineReducers } from '@reduxjs/toolkit';
import generalSlice from '../features/general/generalSlice'; // Đặt tên biến import là gì cũng được

export default combineReducers({
  general: generalSlice,   // <--- QUAN TRỌNG: Phải đặt key là 'general'
});