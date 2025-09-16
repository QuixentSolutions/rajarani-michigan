const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const healthRoutes = require("./routes/health");
const orderRoutes = require("./routes/orders");
const menuRoutes = require("./routes/menu");
const registerRoutes = require("./routes/register");
const settingsRoutes = require("./routes/settings");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const paymentRoutes = require("./routes/payment");
app.use("/api/payment", paymentRoutes);

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/rajarani", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MongoDB connection event listeners
const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB successfully');
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

app.use("/health", healthRoutes);
app.use("/menu", menuRoutes);
app.use("/order", orderRoutes);
app.use("/register", registerRoutes);
app.use("/settings", settingsRoutes);

const PORT = 5001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${5001}`)
);