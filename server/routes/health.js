const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.status(201).json({ status: "OK" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
