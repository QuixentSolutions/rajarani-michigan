const express = require("express");
const router = express.Router();
const DeliveryPartner = require("../models/deliveryPartner");

// GET /delivery-partners
router.get("/", async (req, res) => {
  try {
    const partners = await DeliveryPartner.find({ storeId: req.storeId }).sort({ createdAt: 1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /delivery-partners
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Partner name is required" });
    const exists = await DeliveryPartner.findOne({ storeId: req.storeId, name: name.trim() });
    if (exists) return res.status(400).json({ error: "Partner already exists" });
    const partner = new DeliveryPartner({ storeId: req.storeId, name: name.trim() });
    const saved = await partner.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /delivery-partners/:id
router.delete("/:id", async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    res.json({ message: "Partner deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
