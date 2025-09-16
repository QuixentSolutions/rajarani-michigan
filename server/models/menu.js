const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
title: { type: String, required: true },
color: String,
items: [
{
name: String,
price: Number,
spiceLevels: [String],
addons: [
  {
    name: String,
    price: Number,
  },
],
},
],
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("menus", menuSchema);
