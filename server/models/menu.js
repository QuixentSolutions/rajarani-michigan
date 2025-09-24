const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: String,
  days: [String],
  items: [
    {
      name: String,
      price: Number,
      spicelevel: [String],
      addons: [
        {
          name: String,
          price: Number,
        },
      ],
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Menu", menuSchema);