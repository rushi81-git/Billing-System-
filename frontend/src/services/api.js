import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

const validateSKU = (sku) => {
  const trimmed = String(sku).trim();
  if (trimmed.length === 0) throw new Error('SKU cannot be empty');
  if (trimmed.length > 50) throw new Error('SKU too long');
  if (!/^[A-Z0-9\-_]+$/i.test(trimmed)) throw new Error('Invalid SKU format');
  return trimmed.toUpperCase();
};

export const productService = {
  getProductBySKU: async (sku) => {
    try {
      const normalized = validateSKU(sku);
      const response = await api.get(`/scan/${normalized}`);
      return response.data;
    } catch (error) {
      if (error.message && error.message.includes('SKU')) {
        throw new Error(error.message);
      }
      throw error.response?.data || new Error('Network error');
    }
  },

  getAllProducts: async (filters = {}) => {
    try {
      const response = await api.get('/products', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch products');
    }
  },

  createProduct: async (data) => {
    try {
      const response = await api.post('/products', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to create product');
    }
  }
};

export const billService = {
  createBill: async (data) => {
    try {
      const response = await api.post('/bills', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to create bill');
    }
  },

  getBillById: async (billId) => {
    try {
      const response = await api.get(`/bills/${billId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch bill');
    }
  }
};

export const pdfService = {
  downloadPDF: async (billId) => {
    try {
      const response = await api.get(`/pdf/${billId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
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
      throw error.response?.data || new Error('Failed to download PDF');
    }
  }
};

export default api;