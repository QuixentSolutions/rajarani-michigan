const express = require("express");
const router = express.Router();
const Settings = require("../models/settings");

router.post("/", async (req, res) => {
  try {
    const setting = new Settings(req.body);
    const savedSettings = await setting.save();
    res.status(201).json(savedSettings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const settings = await Settings.find().sort({ createdAt: -1 });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const settings = await Settings.find().sort({ createdAt: -1 }).limit(1);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
