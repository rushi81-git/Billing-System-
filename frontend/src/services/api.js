import axios from 'axios';

// Auto-detect API URL: localhost or network IP
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return `http://${hostname}:5000/api`;
};
const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_owner');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
  logout:   ()     => api.post('/auth/logout'),
};

// ── Customers ────────────────────────────────────────────
export const customerAPI = {
  lookupOrCreate: (data) => api.post('/customers/lookup', data),
  list:           ()     => api.get('/customers'),
  getBills:       (id)   => api.get(`/customers/${id}/bills`),
};

// ── Products ─────────────────────────────────────────────
export const productAPI = {
  scan:   (sku)  => api.post('/products/scan', { sku }),
  list:   (search = '') => api.get(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id)   => api.delete(`/products/${id}`),
  get:    (id)   => api.get(`/products/${id}`),
};

// ── Bills ────────────────────────────────────────────────
export const billAPI = {
  checkout:         (data)  => api.post('/bills/checkout', data),
  list:             ()      => api.get('/bills'),
  get:              (id)    => api.get(`/bills/${id}`),
  updateStatus:     (id, status) => api.patch(`/bills/${id}/status`, { payment_status: status }),
  getPublicInvoice: (token) => api.get(`/bills/invoice/${token}`),
};

export default api;
