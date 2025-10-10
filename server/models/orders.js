const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    name: String,
    phone: String,
    email: String,
  },
  orderType: {
    type: String,
    enum: ["dinein", "pickup", "delivery"],
    required: true,
  },
  tableNumber: { type: String },
  deliveryAddress: { type: String, required: false },
  deliveryInstructions: String,
  items: [
    {
      itemId: mongoose.Schema.Types.ObjectId,
      name: String,
      quantity: Number,
      price: Number,
      basePrice: Number,
      spiceLevel: String, // Removed enum constraint
      addons: [
        {
          name: String,
          price: Number,
        },
      ],
    },
  ],
  subTotal: Number,
  salesTax: Number,
  totalAmount: Number,
  tips: Number,
  payment: {
    method: { type: String, enum: ["cash", "card", "upi"] },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: String,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "completed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  sentToKitchen: { type: Number, enum: [0, 1], default: 0 },
});

module.exports = mongoose.model("Order", orderSchema);
