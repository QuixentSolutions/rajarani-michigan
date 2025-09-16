const express = require("express");
const router = express.Router();
const Menu = require("../models/menu");

router.post("/", async (req, res) => {
  try {
    const records = req.body.data;

    // Prepare bulk operations
    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: { _id: record._id },
        update: { $set: record },
        upsert: false, // set to true if you want to insert if not found
      },
    }));

    const result = await Menu.bulkWrite(bulkOps);

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Main menu endpoint - now returns all menu items without day filtering
router.get("/", async (req, res) => {
  try {
    const menu = await Menu.find(); // Removed day filtering to show all menu items
    const result = {
      message: "Menu sections retrieved successfully",
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keep the /all endpoint for backwards compatibility
router.get("/all", async (req, res) => {
  try {
    const menu = await Menu.find();
    const result = {
      message: "Menu sections retrieved successfully",
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Add a day-specific endpoint if you need day filtering later
router.get("/day/:day", async (req, res) => {
  try {
    const { day } = req.params;
    const menu = await Menu.find({
      days: day,
    });
    const result = {
      message: `Menu sections for ${day} retrieved successfully`,
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Add today's menu endpoint if you need current day filtering later
router.get("/today", async (req, res) => {
  try {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = daysOfWeek[new Date().getDay()];

    const menu = await Menu.find({
      days: today,
    });
    const result = {
      message: "Today's menu sections retrieved successfully",
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to add a new item to a category
router.post("/category/:categoryId/item", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, price, spiceLevels, addons } = req.body;
    const updatedCategory = await Menu.findByIdAndUpdate(
      categoryId,
      { $push: { items: { name, price, spiceLevels, addons } } },
      { new: true, runValidators: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(201).json(updatedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Route to update an item within a specific category
router.put("/category/:categoryId/item/:itemId", async (req, res) => {
  try {
    const { categoryId, itemId } = req.params;
    const { name, price, spiceLevels, addons } = req.body;

    const updatedCategory = await Menu.findOneAndUpdate(
      { _id: categoryId, "items._id": itemId },
      { $set: { "items.$.name": name, "items.$.price": price, "items.$.spiceLevels": spiceLevels, "items.$.addons": addons } },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category or item not found" });
    }
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Route to remove an item from a specific category
router.delete("/category/:categoryId/item/:itemId", async (req, res) => {
  try {
    const { categoryId, itemId } = req.params;

    const updatedCategory = await Menu.findByIdAndUpdate(
      categoryId,
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category or item not found" });
    }
    res.json({ message: "Item deleted successfully", updatedCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
