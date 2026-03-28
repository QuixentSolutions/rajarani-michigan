const mongoose = require("mongoose");

const deliveryPartnerSalesSchema = new mongoose.Schema({
  storeId: { type: String, required: true, index: true },
  partnerName: { type: String, required: true },
  date: { type: Date, required: true },
  grossAmount: { type: Number, default: 0 },    // total sales reported to the partner that day
  settled: { type: Boolean, default: false },    // has the partner settled the payout?
  settlementDate: { type: Date, default: null },
  commission: { type: Number, default: 0 },      // commission/fee deducted by the partner
  netAmount: { type: Number, default: 0 },       // grossAmount - commission (actual received)
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeliveryPartnerSales", deliveryPartnerSalesSchema);
