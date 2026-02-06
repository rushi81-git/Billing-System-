/**
 * Barcode Controller (SKU-based)
 * --------------------------------
 * Backend ONLY validates SKU existence
 */

const Product = require('../models/Product');

/**
 * GET /api/barcode/:productId
 * Validate product SKU after scan
 */
exports.validateBarcode = async (req, res) => {
  try {
    let { productId } = req.params;

    if (!productId || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product ID (SKU) is required'
      });
    }

    // Normalize SKU
    productId = String(productId).trim().toUpperCase();

    const product = await Product.findOne({ productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Barcode validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = exports;
