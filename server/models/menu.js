const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  color: String,
  items: [
    {
      name: String,
      price: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("menus", menuSchema);
