const express = require("express");
const router = express.Router();
const ManualSales = require("../models/manualSales");

// GET /manual-sales?type=dinein|online&page=1&limit=50
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { storeId: req.storeId };
    if (req.query.type) filter.type = req.query.type;

    const [entries, total] = await Promise.all([
      ManualSales.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      ManualSales.countDocuments(filter),
    ]);

    res.json({ results: entries, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /manual-sales
router.post("/", async (req, res) => {
  try {
    const entry = new ManualSales({ ...req.body, storeId: req.storeId });
    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /manual-sales/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await ManualSales.findOneAndUpdate(
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

// DELETE /manual-sales/:id
router.delete("/:id", async (req, res) => {
  try {
    const entry = await ManualSales.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
