const express = require("express");
const router = express.Router();
const Catering = require("../models/catering");

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Reports must come before /:id

// GET /catering/reports/:period  — daily(30d) | weekly(8w) | monthly(12m)
router.get("/reports/:period", async (req, res) => {
  try {
    const { period } = req.params;
    const now = new Date();
    let matchDate, groupId, labelFn;

    if (period === "daily") {
      matchDate = new Date(now); matchDate.setDate(now.getDate() - 29);
      groupId = { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } };
      labelFn = (r) => `${r._id.year}-${String(r._id.month).padStart(2,"0")}-${String(r._id.day).padStart(2,"0")}`;
    } else if (period === "weekly") {
      matchDate = new Date(now); matchDate.setDate(now.getDate() - 56);
      groupId = { year: { $isoWeekYear: "$date" }, week: { $isoWeek: "$date" } };
      labelFn = (r) => `Week ${r._id.week}, ${r._id.year}`;
    } else {
      matchDate = new Date(now); matchDate.setMonth(now.getMonth() - 11); matchDate.setDate(1);
      groupId = { year: { $year: "$date" }, month: { $month: "$date" } };
      labelFn = (r) => `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`;
    }

    const Catering = require("../models/catering");
    const raw = await Catering.aggregate([
      { $match: { storeId: req.storeId, date: { $gte: matchDate } } },
      { $group: { _id: groupId, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);
    res.json(raw.map((r) => ({ label: labelFn(r), total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /catering/reports/weekly (kept for backwards compat)
router.get("/reports/weekly", async (req, res) => {
  try {
    const now = new Date();
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 7 * 8);

    const raw = await Catering.aggregate([
      { $match: { storeId: req.storeId, eventDate: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: { year: { $isoWeekYear: "$eventDate" }, week: { $isoWeek: "$eventDate" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const results = raw.map((r) => ({
      label: `Week ${r._id.week}, ${r._id.year}`,
      week: r._id.week,
      year: r._id.year,
      total: r.total,
      count: r.count,
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /catering/reports/monthly
router.get("/reports/monthly", async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const raw = await Catering.aggregate([
      { $match: { storeId: req.storeId, eventDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$eventDate" }, month: { $month: "$eventDate" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const results = raw.map((r) => ({
      label: `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
      month: r._id.month,
      year: r._id.year,
      total: r.total,
      count: r.count,
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /catering — paginated list
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { storeId: req.storeId };
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Catering.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Catering.countDocuments(filter),
    ]);

    res.json({ results: orders, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /catering
router.post("/", async (req, res) => {
  try {
    const order = new Catering({ ...req.body, storeId: req.storeId });
    const saved = await order.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /catering/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Catering.findOneAndUpdate(
      { _id: req.params.id, storeId: req.storeId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Catering order not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /catering/:id
router.delete("/:id", async (req, res) => {
  try {
    const order = await Catering.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    if (!order) return res.status(404).json({ error: "Catering order not found" });
    res.json({ message: "Catering order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
