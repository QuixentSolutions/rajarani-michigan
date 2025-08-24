const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many admin requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting for all routes - more lenient
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => {
    return process.env.NODE_ENV === "development";
  },
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
};

// --- Apply Security Middleware ---

// --- START OF THE FIX ---
// 1. CORS must come FIRST to handle preflight requests before they are rate-limited or blocked.
app.use(cors({ origin: "http://localhost:3000" }));

// 2. Body parser should come before other middleware that needs to read the request body.
app.use(express.json({ limit: "10mb" }));

// 3. Other security middleware can come after.
app.use(securityHeaders);
app.use(generalRateLimit);
// --- END OF THE FIX ---

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ====== ROOT HEALTH CHECK ======
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Raja Rani backend is running successfully" });
});

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/rajarani")
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// ====== MODELS ======
const registrationSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobileNumber: String,
  registrationDate: { type: Date, default: Date.now },
});
const Registration = mongoose.model(
  "Registration",
  registrationSchema,
  "registrations"
);

const itemSchema = new mongoose.Schema(
  {
    name: String,
    quantity: Number,
    price: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  orderId: String,
  mobileNumber: String,
  email: String,
  orderMode: String,
  items: [itemSchema],
  totalAmount: Number,
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  orderDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema, "orders");

// Menu item schema with proper _id generation
const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    newPrice: { type: String, required: true },
    oldPrice: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true } // Ensure _id is generated
);

const menuSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: { type: String, default: "#FFA500" },
  items: [menuItemSchema],
  itemCount: { type: Number, default: 0 },
  createdDate: { type: Date, default: Date.now },
});

const MenuSection = mongoose.model(
  "MenuSection",
  menuSectionSchema,
  "menu_sections"
);

// ====== AUTH MIDDLEWARE ======
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Raja Rani Admin Area"');
      return res
        .status(401)
        .json({ message: "Unauthorized: Authorization header missing." });
    }
    const [type, credentials] = authHeader.split(" ");
    if (type !== "Basic" || !credentials) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Raja Rani Admin Area"');
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid authorization type." });
    }
    const decoded = Buffer.from(credentials, "base64").toString("ascii");
    const [username, password] = decoded.split(":");
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "QuiX3nt!";
    if (username === adminUsername && password === adminPassword) {
      next();
    } else {
      res.setHeader("WWW-Authenticate", 'Basic realm="Raja Rani Admin Area"');
      return res
        .status(403)
        .json({ message: "Forbidden: Invalid credentials." });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication system error" });
  }
};

// ====== PUBLIC ROUTES ======
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, mobileNumber } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }
    const newRegistration = new Registration({ name, email, mobileNumber });
    await newRegistration.save();
    res.status(201).json({
      message: "Registration successful!",
      data: newRegistration,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error while saving registration.",
      error: error.message,
    });
  }
});

app.post("/api/order", async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.orderId) {
      orderData.orderId = "ORD-" + Date.now();
    }
    const newOrder = new Order(orderData);
    await newOrder.save();
    res.status(201).json({
      message: "Order placed successfully!",
      data: newOrder,
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({
      message: "Server error while saving order.",
      error: error.message,
    });
  }
});

app.get("/api/menu", async (req, res) => {
  try {
    const menuSections = await MenuSection.find().sort({ createdDate: 1 });
    res.status(200).json({
      message: "Menu sections retrieved successfully",
      sections: menuSections,
    });
  } catch (error) {
    console.error("Menu fetch error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch menu sections", error: error.message });
  }
});

// ====== ADMIN ROUTES ======
app.use("/api/admin", adminRateLimit, authenticateAdmin);

// Fix existing items endpoint
app.post("/api/admin/fix-existing-items", async (req, res) => {
  try {
    console.log("Starting fix-existing-items operation...");
    const sections = await MenuSection.find();
    let totalItemsFixed = 0;
    let sectionsProcessed = 0;

    for (const section of sections) {
      let needsSave = false;
      console.log(
        `Processing section: ${section.title} with ${section.items.length} items`
      );
      section.items.forEach((item, index) => {
        if (!item._id) {
          console.log(
            `Fixing item ${index}: ${item.name} - adding new ObjectId`
          );
          item._id = new mongoose.Types.ObjectId();
          totalItemsFixed++;
          needsSave = true;
        }
      });

      if (needsSave) {
        section.itemCount = section.items.length;
        await section.save();
        sectionsProcessed++;
        console.log(`Saved section: ${section.title}`);
      }
    }

    console.log(
      `Fix complete: ${totalItemsFixed} items fixed in ${sectionsProcessed} sections`
    );
    res.json({
      message: "Successfully fixed existing menu items",
      sectionsProcessed: sectionsProcessed,
      totalItemsFixed: totalItemsFixed,
    });
  } catch (error) {
    console.error("Fix items error:", error);
    res
      .status(500)
      .json({ message: "Failed to fix items", error: error.message });
  }
});

// Paginated get routes with search
const createPaginatedGetRoute =
  (model, searchFields = []) =>
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
      const search = req.query.search || "";

      let query = {};
      if (search && searchFields.length > 0) {
        query = {
          $or: searchFields.map((field) => ({
            [field]: { $regex: search, $options: "i" },
          })),
        };
      }

      const totalItems = await model.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const items = await model
        .find(query)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        items,
        totalPages,
        currentPage: page,
        totalItems,
      });
    } catch (error) {
      console.error(`Paginated get error for ${model.modelName}:`, error);
      res.status(500).json({
        message: `Failed to fetch data from ${model.modelName}`,
        error: error.message,
      });
    }
  };

app.get(
  "/api/admin/registrations",
  createPaginatedGetRoute(Registration, ["name", "email"])
);
app.get(
  "/api/admin/orders",
  createPaginatedGetRoute(Order, ["orderId", "email", "mobileNumber"])
);

app.get("/api/admin/menu", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let query = {};
    if (search) {
      query = { title: { $regex: search, $options: "i" } };
    }

    const totalItems = await MenuSection.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const sections = await MenuSection.find(query)
      .sort({ createdDate: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      sections,
      totalPages,
      currentPage: page,
      totalItems,
    });
  } catch (error) {
    console.error("Admin menu fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch menu sections",
      error: error.message,
    });
  }
});

app.get("/api/admin/menu/:id", async (req, res) => {
  try {
    console.log(`Fetching menu section with ID: ${req.params.id}`);
    const section = await MenuSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Menu section not found." });
    }
    res.status(200).json(section);
  } catch (error) {
    console.error(`Get menu section error:`, error);
    res
      .status(500)
      .json({ message: `Failed to fetch menu section.`, error: error.message });
  }
});

app.put("/api/admin/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    order.status = status.toLowerCase();
    order.lastUpdated = Date.now();
    await order.save();
    res
      .status(200)
      .json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      message: "Failed to update order status.",
      error: error.message,
    });
  }
});

// Add menu item endpoint with proper validation and _id generation
app.post("/api/admin/menu/:id/items", async (req, res) => {
  try {
    const { id: sectionId } = req.params;
    const { name, newPrice, oldPrice } = req.body;

    console.log("Adding item request:", {
      sectionId,
      name,
      newPrice,
      oldPrice,
    });

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: "Invalid section ID format." });
    }

    if (!name || !newPrice) {
      return res
        .status(400)
        .json({ message: "Name and newPrice are required." });
    }

    const section = await MenuSection.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Menu section not found." });
    }

    // Create new item with explicit _id generation
    const newItem = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      newPrice: newPrice.toString(),
      oldPrice: oldPrice ? oldPrice.toString() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Creating new item:", newItem);

    section.items.push(newItem);
    section.itemCount = section.items.length;

    await section.save();

    console.log("Item added successfully, section updated");

    res.status(201).json({
      message: "Menu item added successfully",
      section,
      addedItem: newItem,
    });
  } catch (error) {
    console.error("Add menu item error:", error);
    res
      .status(500)
      .json({ message: "Failed to add menu item", error: error.message });
  }
});

// Update menu item endpoint with better error handling
app.put("/api/admin/menu/:id/items/:itemId", async (req, res) => {
  try {
    const { id: sectionId, itemId } = req.params;
    const { name, newPrice, oldPrice } = req.body;

    console.log("Update request:", {
      sectionId,
      itemId,
      name,
      newPrice,
      oldPrice,
    });

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: "Invalid section ID format." });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid item ID format." });
    }

    const section = await MenuSection.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Menu section not found." });
    }

    const item = section.items.id(itemId);
    if (!item) {
      console.log(
        "Available item IDs:",
        section.items.map((i) => i._id)
      );
      return res
        .status(404)
        .json({ message: "Menu item not found for update." });
    }

    // Update fields if provided
    if (name !== undefined) item.name = name.trim();
    if (newPrice !== undefined) item.newPrice = newPrice.toString();
    if (oldPrice !== undefined)
      item.oldPrice = oldPrice ? oldPrice.toString() : null;
    item.updatedAt = new Date();

    await section.save();

    console.log("Item updated successfully");

    res.status(200).json({
      message: "Menu item updated successfully",
      section,
      updatedItem: item,
    });
  } catch (error) {
    console.error("Update menu item error:", error);
    res
      .status(500)
      .json({ message: "Failed to update menu item", error: error.message });
  }
});

// Delete menu item endpoint with better validation
app.delete("/api/admin/menu/:id/items/:itemId", async (req, res) => {
  try {
    const { id: sectionId, itemId } = req.params;

    console.log("Delete request:", { sectionId, itemId });

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: "Invalid section ID format." });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid item ID format." });
    }

    const section = await MenuSection.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Menu section not found." });
    }

    const itemExists = section.items.id(itemId);
    if (!itemExists) {
      console.log(
        "Available item IDs:",
        section.items.map((i) => i._id)
      );
      return res
        .status(404)
        .json({ message: "Menu item not found for deletion." });
    }

    // Remove the item using Mongoose subdocument methods
    section.items.pull(itemId);
    section.itemCount = section.items.length;
    await section.save();

    console.log("Item deleted successfully");

    res.status(200).json({
      message: "Menu item deleted successfully",
      section,
      deletedItemId: itemId,
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete menu item", error: error.message });
  }
});

// Add menu section endpoint (for creating new sections)
app.post("/api/admin/menu", async (req, res) => {
  try {
    const { title, color } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const newSection = new MenuSection({
      title: title.trim(),
      color: color || "#FFA500",
      items: [],
      itemCount: 0,
    });

    await newSection.save();

    res.status(201).json({
      message: "Menu section created successfully",
      section: newSection,
    });
  } catch (error) {
    console.error("Create menu section error:", error);
    res
      .status(500)
      .json({ message: "Failed to create menu section", error: error.message });
  }
});

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// ====== 404 HANDLER ======
app.all("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
