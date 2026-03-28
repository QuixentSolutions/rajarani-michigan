const mongoose = require("mongoose");

const manualSalesSchema = new mongoose.Schema({
  storeId: { type: String, required: true, index: true },
  type: { type: String, enum: ["dinein", "online"], required: true },
  date: { type: Date, required: true },
  cashAmount: { type: Number, default: 0 },
  cardAmount: { type: Number, default: 0 },       // gross card amount charged to customers
  cardSettled: { type: Boolean, default: false },  // has the card batch settled with the processor?
  cardSettlementDate: { type: Date, default: null },
  cardCommission: { type: Number, default: 0 },   // processor fee deducted on settlement
  cardNetAmount: { type: Number, default: 0 },    // cardAmount - cardCommission (actual received)
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ManualSales", manualSalesSchema);
