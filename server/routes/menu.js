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

    const menu = await Menu.find({
      days: today,
    });
    const result = {
      message: "Menu sections retrieved successfully",
      sections: menu,
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.put("/", async (req, res) => {
//   try {
//     req.body.updatedAt = new Date();
//     const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });
//     res.status(201).json(updatedMenu);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

module.exports = router;
