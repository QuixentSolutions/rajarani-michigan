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

  // ── Food breakdown fields ──────────────────────────────────
  vegCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  nonVegCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  // ── Derived field ─────────────────────
  quantity: {
    type: String,   // total headcount (vegCount + nonVegCount) stored as string
    required: true,
    trim: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: total people (vegCount + nonVegCount)
registrationSchema.virtual("totalPeople").get(function () {
  return (this.vegCount || 0) + (this.nonVegCount || 0);
});

const Registration = mongoose.model("registration", registrationSchema);

module.exports = Registration;