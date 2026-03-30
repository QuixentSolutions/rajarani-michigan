const express = require("express");
const router = express.Router();
const Invoice = require("../models/invoice");

// Reports must come before /:id to avoid route conflict

// GET /invoice/reports/weekly  — last 8 ISO-week buckets
router.get("/reports/weekly", async (req, res) => {
  try {
    const now = new Date();
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 7 * 8);

    const raw = await Invoice.aggregate([
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
          },
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

// GET /invoice/reports/monthly  — last 12 months
router.get("/reports/monthly", async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const raw = await Invoice.aggregate([
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
          },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const MONTH_NAMES = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

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

// GET /invoice  — paginated list
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { storeId: req.storeId };
    if (req.query.status) filter.status = req.query.status;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);

    res.json({ results: invoices, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /invoice/:id
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, storeId: req.storeId });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /invoice
router.post("/", async (req, res) => {
  try {
    const invoice = new Invoice({ ...req.body, storeId: req.storeId });
    const saved = await invoice.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /invoice/:id
router.put("/:id", async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, storeId: req.storeId },
      { $set: req.body },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /invoice/:id
router.delete("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
