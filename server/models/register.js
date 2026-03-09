const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
  },
  eventDate: {
    type: Date,
    default: Date.now,
  },
  eventName: {
    type: String,
  },
  mobile: String,
  quantity: {
    type: String,
    default: "1",
    trim: true,
  },
  foodPreference: {
    type: String,
    enum: ["veg", "non-veg"],
    default: "veg",
    trim: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Registration = mongoose.model("registration", registrationSchema);

module.exports = Registration;
