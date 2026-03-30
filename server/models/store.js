const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  address:   { type: String, default: "" },
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  active:    { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Store", storeSchema);
