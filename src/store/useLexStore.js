import { create } from 'zustand';
import { toast } from 'sonner';
import apiClient from '../lib/api';

const useLexStore = create((set, get) => ({
  currentUser: null,
  accessToken: null, // Access token in-memory
  isLoading: false,
  isRefreshing: false,
  refreshPromise: null,
  error: null,

  // ✅ NEW: Persist token to localStorage
  setAccessToken: (token) => {
    set({ accessToken: token });
    if (token) {
      localStorage.setItem('accessToken', token);  // ✅ Persist
    } else {
      localStorage.removeItem('accessToken');      // ✅ Clean up
    }
  },

  // ✅ UPDATED: Initialize from localStorage
  initAuth: async () => {
    if (get().isRefreshing) return;
    set({ isLoading: true });
    try {
      // Try to restore from localStorage
      const savedToken = localStorage.getItem('accessToken');
      if (savedToken) {
        set({ accessToken: savedToken });
      }
      
      // Refresh to get fresh token + user data
      await get().refreshAccessToken();
    } catch (err) {
      console.log('No existing session found');
      localStorage.removeItem('accessToken');  // ✅ Clear invalid token
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ UPDATED: Use new setAccessToken
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      get().setAccessToken(data.accessToken);  // ✅ Persists + sets Zustand
      set({ currentUser: data.user });
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ UPDATED: Clear both Zustand and localStorage
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      set({ currentUser: null, error: null });
      get().setAccessToken(null);  // ✅ Clears localStorage
    }
  },

  // ✅ UPDATED: Update token on refresh
  refreshAccessToken: async () => {
    if (get().isRefreshing) {
      return get().refreshPromise;
    }

    const refreshPromise = (async () => {
      set({ isRefreshing: true });
      try {
        const { data } = await apiClient.post('/auth/refresh');
        get().setAccessToken(data.accessToken);  // ✅ Persists + sets
        set({ currentUser: data.user });
        return data.accessToken;
      } catch (err) {
        set({ currentUser: null });
        get().setAccessToken(null);  // ✅ Clears on refresh failure
        throw err;
      } finally {
        set({ isRefreshing: false, refreshPromise: null });
      }
    })();

    set({ refreshPromise });
    return refreshPromise;
  },
  
  // Placeholder for AI chat
  sendAiMessage: async (text) => {
    try {
      const { data } = await apiClient.post('/ai/chat', { message: text });
      return data;
    } catch (err) {
      console.error('AI chat error', err);
      return null;
    }
  }
}));

export default useLexStore;
