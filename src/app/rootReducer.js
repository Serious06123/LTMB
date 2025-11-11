import { combineReducers } from '@reduxjs/toolkit';
import generalState from '../features/general/generalSlice';

export default combineReducers({
  generalState,   // thêm reducer vào đây (tên key = tên state nhánh)
});
