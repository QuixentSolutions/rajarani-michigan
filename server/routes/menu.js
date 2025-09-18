const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Menu = require("../models/menu");

// Bulk update/insert
router.post("/", async (req, res) => {
  try {
    const records = req.body.data;

    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: { _id: record._id },
        update: { $set: record },
        upsert: false,
      },
    }));

    const result = await Menu.bulkWrite(bulkOps);
    res.status(201).json(result);
  } catch (err) {
    // console.error("Bulk update error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Default route → return only today's menu
router.get("/", async (req, res) => {
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

    const menu = await Menu.find({ days: today });
    const result = {
      message: "Today's menu sections retrieved successfully",
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    // console.error("Get today's menu error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Return all menu items
router.get("/all", async (req, res) => {
  try {
    const menu = await Menu.find();
    const result = {
      message: "Menu sections retrieved successfully",
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    // console.error("Get all menu error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch menu by specific day
router.get("/day/:day", async (req, res) => {
  try {
    const { day } = req.params;
    const menu = await Menu.find({ days: day });
    const result = {
      message: `Menu sections for ${day} retrieved successfully`,
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    // console.error("Get menu by day error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Shortcut for today's menu
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

    const menu = await Menu.find({ days: today });
    const result = {
      message: "Today's menu sections retrieved successfully",
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    // console.error("Get today's menu error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add item to category
router.post("/category/:categoryId/item", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, price, spicelevel, addons } = req.body;

    // Validate required fields
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ 
        error: "Name and price are required fields" 
      });
    }

    // Ensure categoryId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ 
        error: "Invalid category ID format" 
      });
    }

    const updatedCategory = await Menu.findByIdAndUpdate(
      categoryId,
      { 
        $push: { 
          items: { 
            name, 
            price: parseFloat(price), 
            spicelevel: spicelevel || [], 
            addons: addons || [] 
          } 
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // console.log("Added item successfully to category:", updatedCategory.title);
    res.status(201).json(updatedCategory);
  } catch (err) {
    // console.error("Add item error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Update item in category
router.put("/category/:categoryId/item/:itemId", async (req, res) => {
  try {
    const { categoryId, itemId } = req.params;
    const { name, price, spicelevel, addons } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid item ID format" });
    }

    // Validate required fields
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ 
        error: "Name and price are required fields" 
      });
    }

    const category = await Menu.findById(categoryId);
    if (!category) {
      // console.log("Category not found for PUT.");
      return res.status(404).json({ message: "Category not found" });
    }

    const item = category.items.id(itemId);
    if (!item) {
      // console.log("Item not found within category for PUT.");
      // console.log("Available item IDs:", category.items.map(i => i._id.toString()));
      return res.status(404).json({ message: "Item not found in category" });
    }

    // Update item properties
    item.name = name;
    item.price = parseFloat(price);
    item.spicelevel = spicelevel || [];
    item.addons = addons || [];

    const updatedCategory = await category.save();

    // console.log("Updated Category (PUT):", updatedCategory.title, "- Item:", item.name);
    res.json(updatedCategory);
  } catch (err) {
    // console.error("Error in PUT /menu/category/:categoryId/item/:itemId:", err);
    res.status(400).json({ error: err.message });
  }
});

// Delete item from category
router.delete("/category/:categoryId/item/:itemId", async (req, res) => {
  try {
    const { categoryId, itemId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid item ID format" });
    }

    const category = await Menu.findById(categoryId);
    if (!category) {
      // console.log("Category not found for DELETE.");
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if item exists before deletion
    const itemExists = category.items.id(itemId);
    if (!itemExists) {
      // console.log("Item not found within category for DELETE.");
      // console.log("Available item IDs:", category.items.map(i => i._id.toString()));
      return res.status(404).json({ message: "Item not found in category" });
    }

    // Remove the item
    category.items.pull({ _id: itemId });
    const updatedCategory = await category.save();

    // console.log("Deleted item successfully from category:", updatedCategory.title);
    res.json({ message: "Item deleted successfully", updatedCategory });
  } catch (err) {
    // console.error("Error in DELETE /menu/category/:categoryId/item/:itemId:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
