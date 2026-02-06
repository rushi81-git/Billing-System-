const Bill = require('../models/Bill');
const Product = require('../models/Product');

/**
 * Bill Controller
 * Server-side calculations ONLY
 */

/**
 * POST /api/bills
 * Create a new bill with manual discount
 */
exports.createBill = async (req, res) => {
  try {
    const { items, discountPercent = 0 } = req.body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill must contain at least one item'
      });
    }

    // Validate discount percentage
    const maxDiscount = parseFloat(process.env.MAX_DISCOUNT_PERCENT) || 50;
    
    if (discountPercent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount cannot be negative'
      });
    }

    if (discountPercent > maxDiscount) {
      return res.status(400).json({
        success: false,
        message: `Discount cannot exceed ${maxDiscount}%`
      });
    }

    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = await Product.findOne({ productId: item.productId.toUpperCase() });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }
    }

    // Generate unique bill ID
    const billId = await generateBillId();

    // Create bill (pre-save hook will calculate totals)
    const bill = await Bill.create({
      billId,
      items,
      discountPercent: parseFloat(discountPercent),
      subtotal: 0, // Will be calculated in pre-save hook
      discountAmount: 0, // Will be calculated in pre-save hook
      finalAmount: 0 // Will be calculated in pre-save hook
    });

    // Update product stock
    for (const item of items) {
      await Product.findOneAndUpdate(
        { productId: item.productId.toUpperCase() },
        { $inc: { stock: -item.qty } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });

  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bill',
      error: error.message
    });
  }
};

/**
 * GET /api/bills/:billId
 * Get bill by ID
 */
exports.getBillById = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await Bill.findOne({ billId: billId.toUpperCase() });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bill
    });

  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
};

/**
 * GET /api/bills
 * Get all bills with optional filters
 */
exports.getAllBills = async (req, res) => {
  try {
    const { startDate, endDate, minAmount, maxAmount } = req.query;
    
    let query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (minAmount || maxAmount) {
      query.finalAmount = {};
      if (minAmount) query.finalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.finalAmount.$lte = parseFloat(maxAmount);
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });

  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message
    });
  }
};

/**
 * Helper function to generate unique bill ID
 */
async function generateBillId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const billId = `BILL${timestamp}${random}`;
  
  const existing = await Bill.findOne({ billId });
  if (existing) {
    return generateBillId();
  }
  
  return billId;
}
