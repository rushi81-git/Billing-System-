const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true  // Critical: indexed for fast lookup
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  size: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for category + stock queries
productSchema.index({ category: 1, stock: -1 });

// Pre-save: auto-generate barcode if missing
productSchema.pre('save', function(next) {
  if (!this.barcode) {
    this.barcode = this.productId;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);