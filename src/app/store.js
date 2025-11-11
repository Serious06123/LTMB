import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

export const Store = configureStore({ reducer: rootReducer });
export const getToken = () => Store.getState()?.generalState?.token;
