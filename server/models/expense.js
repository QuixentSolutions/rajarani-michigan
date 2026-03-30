const mongoose = require("mongoose");

const CATEGORIES = [
  "Ingredients",
  "Utilities",
  "Staff",
  "Equipment",
  "Rent",
  "Marketing",
  "Maintenance",
  "Other",
];

const expenseSchema = new mongoose.Schema({
  storeId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: CATEGORIES, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Expense", expenseSchema);
