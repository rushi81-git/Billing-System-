import axios from 'axios';

/* ✅ API BASE URL (Netlify + Local Safe) */
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // ⬆️ safer for cloud backends
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/* -------------------- HELPERS -------------------- */

const validateSKU = (sku) => {
  const trimmed = String(sku).trim();
  if (!trimmed) throw new Error('SKU cannot be empty');
  if (trimmed.length > 50) throw new Error('SKU too long');
  if (!/^[A-Z0-9\-_]+$/i.test(trimmed)) {
    throw new Error('Invalid SKU format');
  }
  return trimmed.toUpperCase();
};

const handleError = (error, fallbackMessage) => {
  if (!error.response) {
    throw new Error('Backend unreachable. Check server status.');
  }
  throw error.response.data || new Error(fallbackMessage);
};

/* -------------------- PRODUCT SERVICE -------------------- */

export const productService = {
  getProductBySKU: async (sku) => {
    try {
      const normalized = validateSKU(sku);
      const response = await api.get(`/scan/${normalized}`);
      return response.data;
    } catch (error) {
      if (error.message?.includes('SKU')) {
        throw error;
      }
      handleError(error, 'Failed to fetch product');
    }
  },

  getAllProducts: async (filters = {}) => {
    try {
      const response = await api.get('/products', { params: filters });
      return response.data;
    } catch (error) {
      handleError(error, 'Failed to fetch products');
    }
  },

  createProduct: async (data) => {
    try {
      const response = await api.post('/products', data);
      return response.data;
    } catch (error) {
      handleError(error, 'Failed to create product');
    }
  }
};

/* -------------------- BILL SERVICE -------------------- */

export const billService = {
  createBill: async (data) => {
    try {
      const response = await api.post('/bills', data);
      return response.data;
    } catch (error) {
      handleError(error, 'Failed to create bill');
    }
  },

  getBillById: async (billId) => {
    try {
      const response = await api.get(`/bills/${billId}`);
      return response.data;
    } catch (error) {
      handleError(error, 'Failed to fetch bill');
    }
  }
};

/* -------------------- PDF SERVICE -------------------- */

export const pdfService = {
  downloadPDF: async (billId) => {
    try {
      const response = await api.get(`/pdf/${billId}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/pdf'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${billId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      handleError(error, 'Failed to download PDF');
    }
  }
};

export default api;
