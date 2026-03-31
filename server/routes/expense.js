const express = require("express");
const router = express.Router();
const Expense = require("../models/expense");

// Reports must come before /:id

// GET /expense/reports/:period  — daily(30d) | weekly(8w) | monthly(12m)
router.get("/reports/:period", async (req, res) => {
  try {
    const { period } = req.params;
    const now = new Date();
    let matchDate, groupId, labelFn;
    const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    if (period === "daily") {
      matchDate = new Date(now); matchDate.setDate(now.getDate() - 29);
      groupId = { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" }, category: "$category" };
      labelFn = (r) => `${r._id.year}-${String(r._id.month).padStart(2,"0")}-${String(r._id.day).padStart(2,"0")}`;
    } else if (period === "weekly") {
      matchDate = new Date(now); matchDate.setDate(now.getDate() - 56);
      groupId = { year: { $isoWeekYear: "$date" }, week: { $isoWeek: "$date" }, category: "$category" };
      labelFn = (r) => `Week ${r._id.week}, ${r._id.year}`;
    } else {
      matchDate = new Date(now); matchDate.setMonth(now.getMonth() - 11); matchDate.setDate(1);
      groupId = { year: { $year: "$date" }, month: { $month: "$date" }, category: "$category" };
      labelFn = (r) => `${MN[r._id.month - 1]} ${r._id.year}`;
    }

    const raw = await Expense.aggregate([
      { $match: { storeId: req.storeId, date: { $gte: matchDate } } },
      { $group: { _id: groupId, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);

    const bucketMap = {};
    for (const r of raw) {
      const label = labelFn(r);
      if (!bucketMap[label]) bucketMap[label] = { label, total: 0, count: 0, byCategory: {} };
      bucketMap[label].total += r.total;
      bucketMap[label].count += r.count;
      bucketMap[label].byCategory[r._id.category] = (bucketMap[label].byCategory[r._id.category] || 0) + r.total;
    }
    res.json(Object.values(bucketMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /expense/reports/weekly  — last 8 weeks, with per-category breakdown (backwards compat)
router.get("/reports/weekly", async (req, res) => {
  try {
    const now = new Date();
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 7 * 8);

    const raw = await Expense.aggregate([
      {
        $match: {
          storeId: req.storeId,
          date: { $gte: eightWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$date" },
            week: { $isoWeek: "$date" },
            category: "$category",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    // Reshape: one entry per week, with byCategory map
    const weekMap = {};
    for (const r of raw) {
      const key = `${r._id.year}-W${r._id.week}`;
      if (!weekMap[key]) {
        weekMap[key] = {
          label: `Week ${r._id.week}, ${r._id.year}`,
          week: r._id.week,
          year: r._id.year,
          total: 0,
          count: 0,
          byCategory: {},
        };
      }
      weekMap[key].total += r.total;
      weekMap[key].count += r.count;
      weekMap[key].byCategory[r._id.category] = r.total;
    }

    const results = Object.values(weekMap).sort(
      (a, b) => a.year !== b.year ? a.year - b.year : a.week - b.week
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /expense/reports/monthly  — last 12 months, with per-category breakdown
router.get("/reports/monthly", async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const raw = await Expense.aggregate([
      {
        $match: {
          storeId: req.storeId,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            category: "$category",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const MONTH_NAMES = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthMap = {};
    for (const r of raw) {
      const key = `${r._id.year}-${r._id.month}`;
      if (!monthMap[key]) {
        monthMap[key] = {
          label: `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
          month: r._id.month,
          year: r._id.year,
          total: 0,
          count: 0,
          byCategory: {},
        };
      }
      monthMap[key].total += r.total;
      monthMap[key].count += r.count;
      monthMap[key].byCategory[r._id.category] = r.total;
    }

    const results = Object.values(monthMap).sort(
      (a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /expense  — paginated list
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { storeId: req.storeId };
    if (req.query.category) filter.category = req.query.category;

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(filter),
    ]);

    res.json({ results: expenses, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /expense
router.post("/", async (req, res) => {
  try {
    const expense = new Expense({ ...req.body, storeId: req.storeId });
    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /expense/:id
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
