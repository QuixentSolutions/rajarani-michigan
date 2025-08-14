require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Registration = require('./models/Registration'); 
const Order = require('./models/Order'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); 

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// API endpoint for registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, mobileNumber } = req.body;

    
    if (!name || !email || !mobileNumber) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newRegistration = new Registration({
      name,
      email,
      mobileNumber,
      
    });

    await newRegistration.save();
    res.status(201).json({ message: 'Registration saved successfully!', registration: newRegistration });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error (e.g., unique email)
      return res.status(409).json({ message: 'Email already registered.' });
    }
    console.error('Error saving registration:', error);
    res.status(500).json({ message: 'Error saving registration.', error: error.message });
  }
});

// API endpoint for orders
app.post('/api/order', async (req, res) => {
  try {
    const { orderId, mobileNumber, email, orderMode, tableNumber, address, items, subTotal, salesTax, totalAmount } = req.body;

    // Basic validation (you might want more comprehensive validation)
    if (!orderId || !mobileNumber || !email || !orderMode || !items || items.length === 0 || !subTotal || !salesTax || !totalAmount) {
      return res.status(400).json({ message: 'Missing required order fields.' });
    }

    const newOrder = new Order({
      orderId,
      mobileNumber,
      email,
      orderMode,
      tableNumber: orderMode === 'dinein' ? tableNumber : undefined, // Only save if dinein
      address: orderMode === 'delivery' ? address : undefined, // Only save if delivery
      items,
      subTotal,
      salesTax,
      totalAmount,
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order saved successfully!', order: newOrder });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error for orderId
      return res.status(409).json({ message: 'Order ID already exists.' });
    }
    console.error('Error saving order:', error);
    res.status(500).json({ message: 'Error saving order.', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
