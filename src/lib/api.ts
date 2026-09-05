import axios from 'axios';

const rawBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
const baseURL = rawBaseUrl.replace(/\/api\/?$/, '');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sfr_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sfr_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
