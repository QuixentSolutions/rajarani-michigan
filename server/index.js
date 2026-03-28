const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const healthRoutes = require("./routes/health");
const storeRoutes = require("./routes/stores");
const menuRoutes = require("./routes/menu");
const registerRoutes = require("./routes/register");
const settingsRoutes = require("./routes/settings");
const printerRoutes = require("./routes/printer");
const orderRoutes = require("./routes/orders");
const invoiceRoutes = require("./routes/invoice");
const expenseRoutes = require("./routes/expense");
const cateringRoutes = require("./routes/catering");
const manualSalesRoutes = require("./routes/manualSales");
const deliveryPartnerRoutes = require("./routes/deliveryPartner");
const deliveryPartnerSalesRoutes = require("./routes/deliveryPartnerSales");
const validateStore = require("./middleware/validateStore");
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

app.use("/health", healthRoutes);
app.use("/stores", storeRoutes);

const storeRouter = express.Router({ mergeParams: true });
storeRouter.use(validateStore);
storeRouter.use("/menu", menuRoutes);
storeRouter.use("/order", orderRoutes);
storeRouter.use("/register", registerRoutes);
storeRouter.use("/settings", settingsRoutes);
storeRouter.use("/printer", printerRoutes);
storeRouter.use("/invoice", invoiceRoutes);
storeRouter.use("/expense", expenseRoutes);
storeRouter.use("/catering", cateringRoutes);
storeRouter.use("/manual-sales", manualSalesRoutes);
storeRouter.use("/delivery-partners", deliveryPartnerRoutes);
storeRouter.use("/delivery-partner-sales", deliveryPartnerSalesRoutes);

app.use("/stores/:storeId", storeRouter);

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
