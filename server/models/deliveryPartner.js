const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema({
  storeId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
