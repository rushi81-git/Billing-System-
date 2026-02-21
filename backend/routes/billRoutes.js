const express = require('express');
const { body } = require('express-validator');
const {
  checkout,
  listBills,
  getBill,
  updateStatus,
  getPublicInvoice,
} = require('../controllers/billController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ── Public route (no auth) ──────────────────────────────
// GET /api/bills/invoice/:token
router.get('/invoice/:token', getPublicInvoice);

// ── Protected routes ────────────────────────────────────
router.use(authMiddleware);

// POST /api/bills/checkout
router.post(
  '/checkout',
  [
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('customer_phone')
      .trim()
      .matches(/^\d{10}$/)
      .withMessage('Phone must be exactly 10 digits'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.product_name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required for each item'),
    body('items.*.price')
      .isFloat({ min: 0 })
      .withMessage('Valid price required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Valid quantity required for each item'),
  ],
  validate,
  checkout
);

// GET /api/bills
router.get('/', listBills);

// GET /api/bills/:id
router.get('/:id', getBill);

// PATCH /api/bills/:id/status
router.patch(
  '/:id/status',
  [
    body('payment_status')
      .isIn(['PAID', 'PENDING'])
      .withMessage('Status must be PAID or PENDING'),
  ],
  validate,
  updateStatus
);

module.exports = router;
