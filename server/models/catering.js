const mongoose = require("mongoose");

const cateringSchema = new mongoose.Schema({
  storeId: { type: String, required: true, index: true },
  orderNumber: { type: String },
  customer: {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  eventDate: { type: Date, required: true },
  eventName: { type: String, default: "" },
  headcount: { type: Number, default: 1, min: 1 },
  items: [
    {
      name: { type: String },
      quantity: { type: Number, default: 1 },
      unitPrice: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  ],
  subTotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-generate order number before save
cateringSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Catering").countDocuments({ storeId: this.storeId });
    this.orderNumber = `CAT-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Catering", cateringSchema);
