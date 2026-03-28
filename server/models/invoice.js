const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  storeId: { type: String, required: true, index: true },
  invoiceNo: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  customer: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  items: [
    {
      description: { type: String, default: "" },
      qty: { type: Number, default: 1 },
      unitPrice: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
  ],
  subtotal: { type: Number, default: 0 },
  discountPct: { type: Number, default: 0 },
  discountAmt: { type: Number, default: 0 },
  taxAmt: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["draft", "paid"], default: "draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

invoiceSchema.index({ storeId: 1, invoiceNo: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
