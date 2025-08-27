const express = require("express");
const router = express.Router();
const Menu = require("../models/menu");

// router.post("/", async (req, res) => {
//   try {
//     const menu = new Menu(req.body);
//     const savedMenu = await menu.save();
//     res.status(201).json(savedMenu);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

router.get("/", async (req, res) => {
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
