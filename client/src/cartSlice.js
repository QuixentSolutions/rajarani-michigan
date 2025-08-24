import { createSlice } from "@reduxjs/toolkit";

// Load from localStorage if exists
const savedCart = JSON.parse(localStorage.getItem("cart")) || {
  items: {},
  totalItems: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState: savedCart,
  reducers: {
    updateQuantity: (state, action) => {
      const { itemName, change, price } = action.payload;
      const currentQty = state.items[itemName]?.quantity || 0;
      const newQty = Math.max(0, currentQty + change);

      if (newQty > currentQty) {
        state.totalItems += 1;
      } else if (newQty < currentQty && currentQty > 0) {
        state.totalItems = Math.max(0, state.totalItems - 1);
      }

      if (newQty === 0) {
        delete state.items[itemName];
      } else {
        state.items[itemName] = { quantity: newQty, price };
      }

      localStorage.setItem("cart", JSON.stringify(state));
    },

    clearCart: (state) => {
      state.items = {};
      state.totalItems = 0;

      localStorage.removeItem("cart");
    },
  },
});

export const { updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
