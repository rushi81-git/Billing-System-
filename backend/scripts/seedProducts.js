require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const sampleProducts = [
  { productId: 'SKU001', barcode: 'SKU001', name: 'Men Cotton Shirt - Blue', price: 1499, size: 'L', category: 'Shirt', stock: 25 },
  { productId: 'SKU002', barcode: 'SKU002', name: 'Women Floral Dress', price: 2499, size: 'M', category: 'Dress', stock: 15 },
  { productId: 'SKU003', barcode: 'SKU003', name: 'Men Denim Jeans', price: 2999, size: '32', category: 'Jeans', stock: 30 },
  { productId: 'SKU004', barcode: 'SKU004', name: 'Women Cotton T-Shirt', price: 799, size: 'S', category: 'T-Shirt', stock: 40 },
  { productId: 'SKU005', barcode: 'SKU005', name: 'Men Formal Blazer', price: 4999, size: 'L', category: 'Blazer', stock: 10 },
  { productId: 'SKU006', barcode: 'SKU006', name: 'Women Skinny Jeans', price: 2199, size: '28', category: 'Jeans', stock: 20 },
  { productId: 'SKU007', barcode: 'SKU007', name: 'Men Polo T-Shirt', price: 1299, size: 'M', category: 'T-Shirt', stock: 35 },
  { productId: 'SKU008', barcode: 'SKU008', name: 'Women Summer Top', price: 899, size: 'L', category: 'Top', stock: 28 },
  { productId: 'SKU009', barcode: 'SKU009', name: 'Men Casual Chinos', price: 1899, size: '34', category: 'Pants', stock: 22 },
  { productId: 'SKU010', barcode: 'SKU010', name: 'Women Evening Gown', price: 5999, size: 'M', category: 'Dress', stock: 8 }
];

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');

    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    
    console.log(`✓ Inserted ${sampleProducts.length} products with barcodes`);
    console.log('✓ All products have indexed barcode field for fast lookup');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();