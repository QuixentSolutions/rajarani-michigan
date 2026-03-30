import { createSlice } from "@reduxjs/toolkit";

const persisted = (() => {
  try {
    const raw = localStorage.getItem("selectedStore");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const storeSlice = createSlice({
  name: "store",
  initialState: { selectedStore: persisted },
  reducers: {
    setSelectedStore(state, action) {
      state.selectedStore = action.payload;
      try {
        localStorage.setItem("selectedStore", JSON.stringify(action.payload));
      } catch {}
    },
    clearSelectedStore(state) {
      state.selectedStore = null;
      try {
        localStorage.removeItem("selectedStore");
      } catch {}
    },
  },
});

export const { setSelectedStore, clearSelectedStore } = storeSlice.actions;
export default storeSlice.reducer;
