const mongoose = require("mongoose");

const PrinterSchema = new mongoose.Schema({
  storeId: { type: String, required: true, index: true },
  printerIp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Printer", PrinterSchema);
