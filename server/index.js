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
const printerRoutes = require("./routes/printer");
require("dotenv").config();

const app = express();

app.use((req, res, next) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(cors());
app.use(bodyParser.json());

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
app.use("/printer", printerRoutes);

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
