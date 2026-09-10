import axios from 'axios';

const rawBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
const baseURL = rawBaseUrl.replace(/\/api\/?$/, '');

let inMemoryAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryAuthToken = token;
};

export const getAuthToken = (): string | null => {
  return inMemoryAuthToken;
};

// Immediately purge any stale tokens stored in browser localStorage or sessionStorage
// to ensure no random session (e.g. Volunteer, NGO) is restored on web refresh.
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sfr_token');
    sessionStorage.removeItem('sfr_token');
  }
} catch {
  // Ignore storage access errors
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('sfr_token');
          sessionStorage.removeItem('sfr_token');
        } catch {}
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
