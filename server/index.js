const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const healthRoutes = require("./routes/health");
const orderRoutes = require("./routes/orders");
const menuRoutes = require("./routes/menu");
const registerRoutes = require("./routes/register");
const settingsRoutes = require("./routes/settings");
require("dotenv").config();

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

app.use("/health", healthRoutes);
app.use("/menu", menuRoutes);
app.use("/order", orderRoutes);
app.use("/register", registerRoutes);
app.use("/settings", settingsRoutes);

const PORT = 5001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${5001}`)
);
