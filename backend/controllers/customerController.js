const { Customer, Bill } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/customers/lookup
 * Lookup by phone – create if not found
 */
const lookupOrCreate = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const [customer, created] = await Customer.findOrCreate({
      where: { phone },
      defaults: { name, phone },
    });

    // If existing customer, optionally update name
    if (!created && name && customer.name !== name) {
      customer.name = name;
      await customer.save();
    }

    return sendSuccess(
      res,
      created ? 'New customer created.' : 'Existing customer loaded.',
      { customer, isNew: created },
      created ? 201 : 200
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/customers/:id/bills
 * Get bill history for a customer
 */
const getCustomerBills = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [{ model: Bill, as: 'bills', order: [['created_at', 'DESC']] }],
    });

    if (!customer) {
      return sendError(res, 'Customer not found.', null, 404);
    }

    return sendSuccess(res, 'Customer bills fetched.', customer);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/customers
 * List all customers
 */
const listCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      order: [['created_at', 'DESC']],
    });
    return sendSuccess(res, 'Customers fetched.', customers);
  } catch (err) {
    next(err);
  }
};

module.exports = { lookupOrCreate, getCustomerBills, listCustomers };
