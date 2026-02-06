const Product = require('../models/Product');

exports.getProductByBarcode = async (req, res) => {
  try {
    const barcode = req.params.barcode.trim().toUpperCase();

    if (!barcode || barcode.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }

    // Indexed lookup - extremely fast
    const product = await Product.findOne({ barcode }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found: ${barcode}`
      });
    }

    if (product.stock <= 0) {
      return res.status(200).json({
        success: true,
        warning: 'Product is out of stock',
        data: product
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { productId, name, price, size, category, stock } = req.body;

    // Auto-generate barcode from productId if not provided
    const barcode = req.body.barcode || productId;

    const product = await Product.create({
      productId: productId.trim().toUpperCase(),
      barcode: barcode.trim().toUpperCase(),
      name,
      price,
      size,
      category,
      stock
    });

    res.status(201).json({
      success: true,
      message: 'Product created with barcode',
      data: product
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}: ${error.keyValue[field]}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, inStock } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (inStock === 'true') query.stock = { $gt: 0 };

    const products = await Product.find(query)
      .select('-__v')
      .sort({ category: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};