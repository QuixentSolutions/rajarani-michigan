const mongoose = require("mongoose");

// A single time window within a day, e.g. a lunch or dinner shift.
// Times are "HH:MM" (24h) interpreted in the store's timezone.
const sessionSchema = new mongoose.Schema(
  {
    enabled:   { type: Boolean, default: true },
    openTime:  { type: String, default: "09:00" },
    closeTime: { type: String, default: "22:00" },
  },
  { _id: false }
);

// One entry per day of week (0 = Sunday ... 6 = Saturday).
// Each day has an independent morning and afternoon session so the store
// can close in between (e.g. lunch 09:00-14:00, dinner 17:00-22:00).
const dayHoursSchema = new mongoose.Schema(
  {
    open: { type: Boolean, default: true }, // whole day open at all?
    morning: {
      type: sessionSchema,
      default: () => ({ enabled: true, openTime: "09:00", closeTime: "14:00" }),
    },
    afternoon: {
      type: sessionSchema,
      default: () => ({ enabled: true, openTime: "17:00", closeTime: "22:00" }),
    },
  },
  { _id: false }
);

const holidaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD" (store timezone)
    name: { type: String, default: "" },
  },
  { _id: false }
);

// Default schedule (index 0 = Sunday ... 6 = Saturday):
//   Sun        11:30-15:00, 17:00-21:00
//   Mon        Closed
//   Tue-Thu    11:30-15:00, 17:00-21:30
//   Fri-Sat    11:30-15:00, 17:00-22:00
function defaultBusinessHours() {
  const lunch = () => ({ enabled: true, openTime: "11:30", closeTime: "15:00" });
  const dinner = (close) => ({ enabled: true, openTime: "17:00", closeTime: close });
  const openDay = (dinnerClose) => ({
    open: true,
    morning: lunch(),
    afternoon: dinner(dinnerClose),
  });

  return [
    openDay("21:00"), // Sunday
    { open: false, morning: { enabled: false }, afternoon: { enabled: false } }, // Monday closed
    openDay("21:30"), // Tuesday
    openDay("21:30"), // Wednesday
    openDay("21:30"), // Thursday
    openDay("22:00"), // Friday
    openDay("22:00"), // Saturday
  ];
}

const storeSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  address:   { type: String, default: "" },
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  active:    { type: Boolean, default: true },
  // Working-hours configuration (used to gate online orders).
  timezone:      { type: String, default: "America/New_York" }, // EST/EDT
  businessHours: { type: [dayHoursSchema], default: defaultBusinessHours },
  holidays:      { type: [holidaySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Store", storeSchema);
