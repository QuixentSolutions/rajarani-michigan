// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema({
//   // Transaction details from Authorize.Net
//   transactionId: { 
//     type: String, 
//     unique: true, 
//     sparse: true // allows null values but enforces uniqueness when present
//   },
  
//   // Order information
//   orderNumber: { 
//     type: String, 
//     required: true,
//     index: true // for faster queries
//   },
  
//   // Customer information
//   customerEmail: { 
//     type: String, 
//     required: true,
//     index: true // for faster customer queries
//   },
  
//   // Payment amount
//   amount: { 
//     type: Number, 
//     required: true,
//     min: 0
//   },
  
//   // Payment status tracking
//   paymentStatus: { 
//     type: String, 
//     required: true,
//     enum: ['pending', 'approved', 'declined', 'error', 'refunded', 'voided'],
//     default: 'pending',
//     index: true // for status filtering
//   },
  
//   // Authorization code from payment processor
//   authCode: { 
//     type: String 
//   },
  
//   // Error tracking
//   errorMessage: { 
//     type: String 
//   },
  
//   // Additional payment metadata
//   paymentMethod: {
//     type: String,
//     default: 'credit_card',
//     enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'other']
//   },
  
//   // Response code from payment processor
//   responseCode: {
//     type: String
//   },
  
//   // Environment tracking (sandbox/production)
//   environment: {
//     type: String,
//     enum: ['sandbox', 'production'],
//     default: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
//   },
  
//   // IP address for security tracking
//   ipAddress: {
//     type: String
//   },
  
//   // User agent for security tracking
//   userAgent: {
//     type: String
//   },
  
//   // Refund information (if applicable)
//   refunds: [{
//     refundId: String,
//     amount: Number,
//     reason: String,
//     refundedAt: Date,
//     refundedBy: String
//   }],
  
//   // Additional metadata
//   metadata: {
//     type: mongoose.Schema.Types.Mixed,
//     default: {}
//   },
  
//   // Timestamps
//   createdAt: { 
//     type: Date, 
//     default: Date.now,
//     index: true // for date range queries
//   },
  
//   updatedAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// }, {
//   // Enable automatic updatedAt timestamp
//   timestamps: true,
  
//   // Add version key for optimistic locking
//   versionKey: '__v'
// });

// // Indexes for better query performance
// paymentSchema.index({ orderNumber: 1, customerEmail: 1 }); // Compound index for order-customer queries
// paymentSchema.index({ createdAt: -1 }); // For sorting by date (newest first)
// paymentSchema.index({ paymentStatus: 1, createdAt: -1 }); // For status filtering with date sorting

// // Virtual for total refunded amount
// paymentSchema.virtual('totalRefunded').get(function() {
//   if (!this.refunds || this.refunds.length === 0) return 0;
//   return this.refunds.reduce((total, refund) => total + (refund.amount || 0), 0);
// });

// // Virtual for net amount (original - refunds)
// paymentSchema.virtual('netAmount').get(function() {
//   return this.amount - this.totalRefunded;
// });

// // Method to add a refund
// paymentSchema.methods.addRefund = function(refundData) {
//   this.refunds.push({
//     refundId: refundData.refundId,
//     amount: refundData.amount,
//     reason: refundData.reason || 'Customer request',
//     refundedAt: new Date(),
//     refundedBy: refundData.refundedBy || 'System'
//   });
  
//   // Update status if fully refunded
//   if (this.totalRefunded >= this.amount) {
//     this.paymentStatus = 'refunded';
//   }
  
//   return this.save();
// };

// // Static method to find payments by status
// paymentSchema.statics.findByStatus = function(status, options = {}) {
//   const query = this.find({ paymentStatus: status });
  
//   if (options.limit) query.limit(options.limit);
//   if (options.sort) query.sort(options.sort);
//   if (options.populate) query.populate(options.populate);
  
//   return query;
// };

// // Static method to get payment statistics
// paymentSchema.statics.getStats = function(dateRange = {}) {
//   const match = {};
  
//   if (dateRange.from) match.createdAt = { $gte: new Date(dateRange.from) };
//   if (dateRange.to) {
//     match.createdAt = match.createdAt || {};
//     match.createdAt.$lte = new Date(dateRange.to);
//   }
  
//   return this.aggregate([
//     { $match: match },
//     {
//       $group: {
//         _id: '$paymentStatus',
//         count: { $sum: 1 },
//         totalAmount: { $sum: '$amount' },
//         avgAmount: { $avg: '$amount' }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         stats: {
//           $push: {
//             status: '$_id',
//             count: '$count',
//             totalAmount: '$totalAmount',
//             avgAmount: '$avgAmount'
//           }
//         },
//         totalTransactions: { $sum: '$count' },
//         totalRevenue: { $sum: '$totalAmount' }
//       }
//     }
//   ]);
// };

// // Pre-save middleware to update timestamps
// paymentSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// // Post-save middleware for logging
// paymentSchema.post('save', function(doc) {
//   console.log(`Payment record ${doc._id} saved with status: ${doc.paymentStatus}`);
// });

// module.exports = mongoose.model("Payment", paymentSchema);