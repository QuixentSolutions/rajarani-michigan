const express = require("express");
const router = express.Router();
const ManualSales = require("../models/manualSales");

// GET /manual-sales/reports/:period  — daily (30d) | weekly (8w) | monthly (12m)
router.get("/reports/:period", async (req, res) => {
  try {
    const { period } = req.params;
    const type = req.query.type; // optional filter
    const now = new Date();

    let matchDate;
    let groupId;
    let labelFn;

    if (period === "daily") {
      matchDate = new Date(now); matchDate.setDate(now.getDate() - 29);
      groupId = { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } };
      labelFn = (r) => `${r._id.year}-${String(r._id.month).padStart(2,"0")}-${String(r._id.day).padStart(2,"0")}`;
    } else if (period === "weekly") {
      matchDate = new Date(now); matchDate.setDate(now.getDate() - 7 * 8);
      groupId = { year: { $isoWeekYear: "$date" }, week: { $isoWeek: "$date" } };
      labelFn = (r) => `Week ${r._id.week}, ${r._id.year}`;
    } else {
      matchDate = new Date(now); matchDate.setMonth(now.getMonth() - 11); matchDate.setDate(1);
      groupId = { year: { $year: "$date" }, month: { $month: "$date" } };
      const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      labelFn = (r) => `${MN[r._id.month - 1]} ${r._id.year}`;
    }

    const match = { storeId: req.storeId, date: { $gte: matchDate } };
    if (type) match.type = type;

    const raw = await require("../models/manualSales").aggregate([
      { $match: match },
      { $group: {
        _id: groupId,
        cash: { $sum: "$cashAmount" },
        cardGross: { $sum: "$cardAmount" },
        cardNet: { $sum: "$cardNetAmount" },
        total: { $sum: { $add: ["$cashAmount", "$cardAmount"] } },
        count: { $sum: 1 },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);

    res.json(raw.map((r) => ({ label: labelFn(r), cash: r.cash, cardGross: r.cardGross, cardNet: r.cardNet, total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
