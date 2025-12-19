import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // selectedShops: items selected on Cart screen to pay (optional)
  selectedShops: null,
  // deliveryLocation: { street, city, lat, lng }
  deliveryLocation: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setSelectedShops: (state, action) => {
      state.selectedShops = action.payload;
    },
    clearSelectedShops: (state) => {
      state.selectedShops = null;
    },
    setDeliveryLocation: (state, action) => {
      state.deliveryLocation = action.payload;
    },
    clearDeliveryLocation: (state) => {
      state.deliveryLocation = null;
    },
  },
});

export const {
  setSelectedShops,
  clearSelectedShops,
  setDeliveryLocation,
  clearDeliveryLocation,
} = cartSlice.actions;

export default cartSlice.reducer;
