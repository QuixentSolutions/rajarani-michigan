const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // npm install express-rate-limit
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security Middleware ---
// More lenient rate limiting for admin routes to prevent lockout during normal usage
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 10 to 50 requests per windowMs for admin operations
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated users in development
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// General rate limiting for all routes - more lenient
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// --- Apply Security Middleware ---
app.use(securityHeaders);
app.use(generalRateLimit);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rajarani')
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const registrationSchema = new mongoose.Schema({ 
  name: String, 
  email: String, 
  mobileNumber: String, 
  registrationDate: { type: Date, default: Date.now } 
});
const Registration = mongoose.model('Registration', registrationSchema, 'registrations');

const itemSchema = new mongoose.Schema({ 
  name: String, 
  quantity: Number, 
  price: Number 
}, { _id: false });

const orderSchema = new mongoose.Schema({ 
  orderId: String, 
  mobileNumber: String, 
  email: String, 
  orderMode: String, 
  tableNumber: String, 
  address: String, 
  items: [itemSchema], 
  subTotal: Number, 
  salesTax: Number, 
  totalAmount: Number, 
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  orderDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema, 'orders');

const menuItemSchema = new mongoose.Schema({
  name: String,
  newPrice: String,
  oldPrice: String
}, { _id: false });

const menuSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: { type: String, default: '#FFA500' },
  items: [menuItemSchema],
  itemCount: { type: Number, default: 0 },
  createdDate: { type: Date, default: Date.now }
});

const MenuSection = mongoose.model('MenuSection', menuSectionSchema, 'menu_sections');

// --- Enhanced Security Middleware for Admin Routes with Browser Support ---
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Raja Rani Admin Area"');
      return res.status(401).json({ message: 'Unauthorized: Authorization header missing.' });
    }
    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic' || !credentials) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Raja Rani Admin Area"');
      return res.status(401).json({ message: 'Unauthorized: Invalid authorization type.' });
    }
    const decoded = Buffer.from(credentials, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
    if (username === adminUsername && password === adminPassword) {
      next();
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Raja Rani Admin Area"');
      return res.status(403).json({ message: 'Forbidden: Invalid credentials.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Authentication system error' });
  }
};

// --- Public API Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const newRegistration = new Registration(req.body);
    await newRegistration.save();
    res.status(201).json({ message: 'Registration successful!', data: newRegistration });
  } catch (error) {
    res.status(500).json({ message: 'Server error while saving registration.', error: error.message });
  }
});

app.post('/api/order', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully!', data: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error while saving order.', error: error.message });
  }
});

// Public route to get menu sections (no authentication required)
app.get('/api/menu', async (req, res) => {
  try {
    const menuSections = await MenuSection.find().sort({ createdDate: 1 });
    res.status(200).json({ message: 'Menu sections retrieved successfully', sections: menuSections, totalSections: menuSections.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu sections', error: error.message });
  }
});

// Route to import menu sections
app.post('/api/importMenu', async (req, res) => {
  try {
    const { menuSections } = req.body;
    if (!menuSections || !Array.isArray(menuSections)) {
      return res.status(400).json({ message: 'Invalid payload. "menuSections" array is required.' });
    }
    await MenuSection.deleteMany({});
    await MenuSection.insertMany(menuSections);
    res.status(201).json({ message: 'Menu imported successfully', totalSections: menuSections.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to import menu', error: error.message });
  }
});

// --- PROTECTED ADMIN API ROUTES (VIEW ONLY) ---
app.use('/api/admin', adminRateLimit, authenticateAdmin);

const createPaginatedGetRoute = (model) => async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const totalItems = await model.countDocuments();
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const items = await model.find().sort({ _id: -1 }).skip(skip).limit(limit);
    res.status(200).json({ items, totalPages, currentPage: page });
  } catch (error) {
    res.status(500).json({ message: `Failed to fetch data from ${model.modelName}` });
  }
};

app.get('/api/admin/registrations', createPaginatedGetRoute(Registration));
app.get('/api/admin/registrations/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found.' });
    res.status(200).json(registration);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch registration.', error: error.message }); }
});

app.get('/api/admin/orders', createPaginatedGetRoute(Order));
app.get('/api/admin/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.status(200).json(order);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch order.', error: error.message }); }
});

app.get('/api/admin/menu', createPaginatedGetRoute(MenuSection));
app.get('/api/admin/menu/:id', async (req, res) => {
  try {
    const section = await MenuSection.findById(req.params.id);
    if (!section) return res.status(404).json({ message: 'Menu section not found.' });
    res.status(200).json(section);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch menu section.', error: error.message }); }
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/', (req, res) => { res.send('Raja Rani Restaurant API'); });

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });
