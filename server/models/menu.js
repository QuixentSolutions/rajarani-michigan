const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  _id: { type: String }, 
  title: { type: String, required: true },
  color: String,
  days: [String],
  items: [
    {
      _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(), // auto-generate for new items
      },
      name: String,
      price: Number,
      spicelevel: [String],
      addons: [
        {
          _id: {
            type: String,
            default: () => new mongoose.Types.ObjectId().toString(), // auto-generate for new addons
          },
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
