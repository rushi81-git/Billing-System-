/**
 * Application Configuration
 */

const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  MAX_DISCOUNT_PERCENT: 70,
  CURRENCY_SYMBOL: '₹',
  STORE_NAME: 'Maalak collection',
  TOAST_DURATION: 3000
};

export default config;
