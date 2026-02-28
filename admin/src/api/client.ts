import axios from 'axios';

const baseURL = import.meta.env.DEV ? 'http://localhost:5001' : '/';

export const adminApiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      window.location.href = base ? `${base}/login` : '/login';
    }
    return Promise.reject(error);
  }
);

export default adminApiClient;
