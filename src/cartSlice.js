import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: {},
    totalItems: 0,
  },
  reducers: {
    updateQuantity: (state, action) => {
      const { itemName, change } = action.payload;
      const currentQty = state.items[itemName] || 0;
      const newQty = Math.max(0, currentQty + change);

      if (newQty > currentQty) {
        state.totalItems += 1;
      } else if (newQty < currentQty) {
        state.totalItems = Math.max(0, state.totalItems - 1);
      }

      if (newQty === 0) {
        delete state.items[itemName];
      } else {
        state.items[itemName] = newQty;
      }
    },
  },
});

export const { updateQuantity } = cartSlice.actions;
export default cartSlice.reducer;