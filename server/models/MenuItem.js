const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  newPrice: { type: String, required: true },
  oldPrice: { type: String, default: null },
});

const menuSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: { type: String, required: true },
  items: [menuItemSchema],
});

const MenuItem = mongoose.model('MenuItem', menuSectionSchema);

module.exports = MenuItem;
