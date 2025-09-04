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
      spiceLevel: {
        type: String,
        enum: ["Medium", "Very Mild", "Hot", "Indian Hot", "Mild"],
      },
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
    enum: [
      "pending",
      "preparing",
      "ready",
      "completed",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
