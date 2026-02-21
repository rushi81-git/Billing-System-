const express = require('express');
const { body } = require('express-validator');
const {
  lookupOrCreate,
  getCustomerBills,
  listCustomers,
} = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All customer routes require auth
router.use(authMiddleware);

// POST /api/customers/lookup
router.post(
  '/lookup',
  [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('phone')
      .trim()
      .matches(/^\d{10}$/)
      .withMessage('Phone must be exactly 10 digits'),
  ],
  validate,
  lookupOrCreate
);

// GET /api/customers
router.get('/', listCustomers);

// GET /api/customers/:id/bills
router.get('/:id/bills', getCustomerBills);

module.exports = router;
