const { v4: uuidv4 } = require('uuid');

/**
 * Generate a human-readable bill ID like BILL-20240125-A3F9
 */
const generateBillId = () => {
  const date = new Date();
  const dateStr = date
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const suffix = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `BILL-${dateStr}-${suffix}`;
};

/**
 * Generate a secure public token for invoice URL
 */
const generatePublicToken = () => {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
};

module.exports = { generateBillId, generatePublicToken };
