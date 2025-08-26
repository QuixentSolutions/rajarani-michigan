const express = require("express");
const router = express.Router();
const Registration = require("../models/registration");

router.post("/", async (req, res) => {
  try {
    const register = new Registration(req.body);
    const savedRegistration = await register.save();
    res.status(201).json(savedRegistration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Registration.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await Registration.findById(req.params.id);
    if (!order)
      return res.status(404).json({ error: "registration not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
