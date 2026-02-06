const mongoose = require('mongoose');

/**
 * Bill Item Schema
 */
const billItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

/**
 * Bill Schema
 * Server calculates all amounts - frontend NEVER recalculates
 */
const billSchema = new mongoose.Schema({
  billId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  items: {
    type: [billItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items.length > 0;
      },
      message: 'Bill must contain at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Calculate totals before saving
billSchema.pre('save', function(next) {
  // Recalculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Calculate discount amount
  this.discountAmount = (this.subtotal * this.discountPercent) / 100;
  
  // Calculate final amount
  this.finalAmount = this.subtotal - this.discountAmount;
  
  next();
});

module.exports = mongoose.model('Bill', billSchema);
