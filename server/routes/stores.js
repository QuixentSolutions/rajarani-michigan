const express = require("express");
const router = express.Router();
const Store = require("../models/store");

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Create store
router.post("/", async (req, res) => {
  try {
    const store = new Store(req.body);
    const saved = await store.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stores within 250 miles of a location
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

    const stores = await Store.find({ active: true });
    const MILES_LIMIT = 250;

    const nearby = stores
      .map((s) => ({ ...s.toObject(), distance: haversine(+lat, +lng, s.latitude, s.longitude) }))
      .filter((s) => s.distance <= MILES_LIMIT)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all active stores
router.get("/", async (req, res) => {
  try {
    const stores = await Store.find({ active: true }).sort({ name: 1 });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one store by slug
router.get("/:storeId", async (req, res) => {
  try {
    const store = await Store.findOne({ slug: req.params.storeId });
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update store
router.put("/:storeId", async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const store = await Store.findOneAndUpdate(
      { slug: req.params.storeId },
      { $set: req.body },
      { new: true }
    );
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-delete store
router.delete("/:storeId", async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { slug: req.params.storeId },
      { $set: { active: false, updatedAt: new Date() } },
      { new: true }
    );
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json({ message: "Store deactivated", store });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
