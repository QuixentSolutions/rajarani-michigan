const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const healthRoutes = require("./routes/health");
const menuRoutes = require("./routes/menu");
const registerRoutes = require("./routes/register");
const settingsRoutes = require("./routes/settings");
const printerRoutes = require("./routes/printer");
const wsServer = require("./ws");

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
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// API routes (now they can access global.broadcast)
app.use("/health", healthRoutes);
app.use("/menu", menuRoutes);
const orderRoutes = require("./routes/orders"); // Load after global.broadcast is set
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

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on http://0.0.0.0:${PORT}`)
);

wsServer.init(server);
