const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: String,
  items: [
    {
      name: String,
      price: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  sentToKitchen: { type: Number, enum: [0, 1], default: 0 },
});

module.exports = mongoose.model("menus", menuSchema);
