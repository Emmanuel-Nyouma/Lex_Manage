import axios from 'axios';
import useLexStore from '../store/useLexStore';
import { API_CONFIG } from '../config/api.config';

const apiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Needed for cookie handling
});
// ...

apiClient.interceptors.request.use((config) => {
  const token = useLexStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cold-start resilience: Render free tier sleeps after ~15 min idle and drops
// the first request while it wakes (~40-60s). We auto-retry network errors so
// requests transparently succeed once the server is up, and emit events so the
// UI can show a "waking up" indicator.
const MAX_NETWORK_RETRIES = 12;
const RETRY_DELAY_MS = 4000;
const emit = (name) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
};

apiClient.interceptors.response.use(
  (response) => {
    emit('api:warmed');
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

    // Retry transient network errors (no response received) during cold starts.
    if (!error.response && !isRefreshRequest) {
      originalRequest._netRetry = originalRequest._netRetry || 0;
      if (originalRequest._netRetry < MAX_NETWORK_RETRIES) {
        originalRequest._netRetry += 1;
        emit('api:warming-up');
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return apiClient(originalRequest);
      }
      emit('api:warmed');
    }

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;
      try {
        const newToken = await useLexStore.getState().refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
