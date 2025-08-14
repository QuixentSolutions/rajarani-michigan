const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId: { 
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  orderMode: {
    type: String,
    required: true,
    enum: ['dinein', 'pickup', 'delivery'], 
  },
  tableNumber: {
    type: String,
    trim: true, 
  },
  address: {
    type: String,
    trim: true, 
  },
  items: [
    orderItemSchema
  ], 
  subTotal: {
    type: Number,
    required: true,
  },
  salesTax: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
