const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const healthRoutes = require("./routes/health");
const orderRoutes = require("./routes/orders");
const menuRoutes = require("./routes/menu");
const registerRoutes = require("./routes/register");
const settingsRoutes = require("./routes/settings");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve React build
app.use(express.static(path.join(__dirname, "../client/build")));

// Fallback for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/rajarani", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// API routes first
app.use("/health", healthRoutes);
app.use("/menu", menuRoutes);
app.use("/order", orderRoutes);
app.use("/register", registerRoutes);
app.use("/settings", settingsRoutes);

// Serve React build
app.use(express.static(path.join(__dirname, "../client/build")));

// Fallback for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rajarani", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
