const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  settings: {
    type: Object,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Settings = mongoose.model("settings", settingsSchema);

module.exports = Settings;
