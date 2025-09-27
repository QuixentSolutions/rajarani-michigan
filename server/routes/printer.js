const express = require("express");
const router = express.Router();
const Printer = require("../models/printer");

router.post("/", async (req, res) => {
  try {
    const printer = new Printer(req.body);
    const savedPrinter = await printer.save();
    res.status(201).json(savedPrinter);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const printer = await Printer.findOne().sort({ createdAt: -1 });
    res.json(printer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
