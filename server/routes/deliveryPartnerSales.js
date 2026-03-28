const express = require("express");
const router = express.Router();
const DeliveryPartnerSales = require("../models/deliveryPartnerSales");

// GET /delivery-partner-sales?partner=DoorDash&page=1&limit=100
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = { storeId: req.storeId };
    if (req.query.partner) filter.partnerName = req.query.partner;

    const [entries, total] = await Promise.all([
      DeliveryPartnerSales.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      DeliveryPartnerSales.countDocuments(filter),
    ]);

    res.json({ results: entries, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /delivery-partner-sales
router.post("/", async (req, res) => {
  try {
    const entry = new DeliveryPartnerSales({ ...req.body, storeId: req.storeId });
    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /delivery-partner-sales/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await DeliveryPartnerSales.findOneAndUpdate(
      { _id: req.params.id, storeId: req.storeId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Entry not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /delivery-partner-sales/:id
router.delete("/:id", async (req, res) => {
  try {
    const entry = await DeliveryPartnerSales.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
