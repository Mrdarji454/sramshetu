import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Centralized Axios instance for ShramSetu
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor: Attach Bearer JWT token if present in localStorage
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shramsetu_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Extract data payload and handle 401 (expired sessions)
 */
apiClient.interceptors.response.use(
  (response) => {
    // If backend uses standard { success: true, data: ..., message: ... } format
    return response.data;
  },
  (error) => {
    // 1. Handle Expired Session / Unauthorized (401)
    if (error.response?.status === 401) {
      // Clear invalid credentials
      localStorage.removeItem('shramsetu_token');
      localStorage.removeItem('shramsetu_user');

      // Dispatch global session expired event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('shramsetu:session-expired', {
            detail: { message: error.response?.data?.message || 'Session expired' },
          })
        );
      }
    }

    // 2. Normalize server error message
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'An unexpected network error occurred';

    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status || 500;
    normalizedError.data = error.response?.data || null;

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
