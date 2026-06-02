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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest.url.includes('/auth/refresh');

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
