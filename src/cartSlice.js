import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: {},
    totalItems: 0,
  },
  reducers: {
    updateQuantity: (state, action) => {
      const { itemName, change, price } = action.payload;
      const currentQty = state.items[itemName]?.quantity || 0;
      const newQty = Math.max(0, currentQty + change);

      if (newQty > currentQty) {
        state.totalItems += 1;
      } else if (newQty < currentQty) {
        state.totalItems = Math.max(0, state.totalItems - 1);
      }

      if (newQty === 0) {
        delete state.items[itemName];
      } else {
        state.items[itemName] = { quantity: newQty, price };
      }
    },
    clearCart: (state) => {
      state.items = {};
      state.totalItems = 0;
    },
  },
});

export const { updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;