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

// {
//   _id: ObjectId('68b0a36189eb99f2b640938c'),
//   name: 'order_settings',
//   settings: { dinein: true, pickup: true, delivery: false },
//   createdAt: ISODate('2025-08-28T18:43:45.488Z'),
//   updatedAt: ISODate('2025-08-28T18:43:45.488Z'),
//   __v: 0
// }
