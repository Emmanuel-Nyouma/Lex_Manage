/**
 * LEXMANAGE - RESILIENT API CLIENT
 * Taxonomy: Fault-Tolerance, Security Interceptor, Resilience
 */

import axios from 'axios';
import useLexStore from '../store/useLexStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const { session } = useLexStore.getState();
    const token = session?.access_token; // Or wherever you store your JWT
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Resilience & Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TASK 4: 401 Unauthorized Handler
    if (error.response?.status === 401) {
      console.warn('[SECURITY] Unauthorized access detected. Wiping local state.');
      const { logout } = useLexStore.getState();
      logout(); // Architectural Rule: Deterministic redirect on auth failure
      window.location.href = '/login';
    }

    // Global Error Reporting
    const message = error.response?.data?.error || error.message || 'Unknown Network Error';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
