const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const billController = require('../controllers/billController');
const pdfController = require('../controllers/pdfController');

// Barcode scanning endpoint (most critical - place first)
router.get('/scan/:barcode', productController.getProductByBarcode);

// Product routes
router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);

// Bill routes
router.post('/bills', billController.createBill);
router.get('/bills/:billId', billController.getBillById);

// PDF route
router.get('/pdf/:billId', pdfController.generatePDF);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

module.exports = router;