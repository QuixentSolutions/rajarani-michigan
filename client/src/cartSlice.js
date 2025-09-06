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
      const {
        itemName,
        change,
        price, // base price
        basePrice,
        spiceLevel = null,
        addons = [], // [{ name, price }]
      } = action.payload;

      // ✅ Addon price calculation
      const addonsTotal = addons.reduce(
        (sum, addon) => sum + parseFloat(addon.price || 0),
        0
      );

      const finalPrice = parseFloat(price) + addonsTotal;

      // ✅ Create a unique key for this variant
      const key =
        itemName +
        (spiceLevel ? `_${spiceLevel}` : "") +
        (addons.length > 0
          ? "_" + addons.map((a) => `${a.name}-${a.price}`).join("_")
          : "");

      const currentQty = state.items[key]?.quantity || 0;
      const newQty = Math.max(0, currentQty + change);

      if (newQty > currentQty) {
        state.totalItems += 1;
      } else if (newQty < currentQty && currentQty > 0) {
        state.totalItems = Math.max(0, state.totalItems - 1);
      }

      if (newQty === 0) {
        delete state.items[key];
      } else {
        state.items[key] = {
          quantity: newQty,
          price: parseFloat(finalPrice).toFixed(2) * newQty, // unit price including addons
          basePrice,
          spiceLevel,
          addons,
          itemName, // keep original name for display
        };
      }

      localStorage.setItem("cart", JSON.stringify(state));
    },

    clearCart: (state) => {
      state.items = {};
      state.totalItems = 0;
      localStorage.removeItem("cart");
    },
    rehydrateCart: (state, action) => {
      const saved = JSON.parse(localStorage.getItem("cart")) || {
        items: {},
        totalItems: 0,
      };
      state.items = saved.items;
      state.totalItems = Object.keys(saved.items).length;
    },
  },
});

export const { updateQuantity, rehydrateCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
