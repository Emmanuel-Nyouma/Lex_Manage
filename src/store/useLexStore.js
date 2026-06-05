import { create } from 'zustand';
import { toast } from 'sonner';
import apiClient from '../lib/api';

const useLexStore = create((set, get) => ({
  currentUser: null,
  accessToken: null, // Access token in-memory
  language: localStorage.getItem('language') || 'en',
  theme: localStorage.getItem('theme') || 'light',
  isLoading: false,
  isRefreshing: false,

  setLanguage: (lang) => {
    set({ language: lang });
    localStorage.setItem('language', lang);
  },

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // ✅ NEW: Persist token to localStorage
  setAccessToken: (token) => {
    set({ accessToken: token });
    if (token) {
      localStorage.setItem('accessToken', token);  // ✅ Persist
      localStorage.setItem('wasLoggedIn', 'true'); // ✅ session hint
    } else {
      localStorage.removeItem('accessToken');      // ✅ Clean up
      localStorage.removeItem('wasLoggedIn');
    }
  },

  // ✅ UPDATED: Initialize from localStorage
  initAuth: async () => {
    if (get().isRefreshing) return;

    // Only try to refresh if we have a hint that a session might exist
    const wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';
    if (!wasLoggedIn) {
      console.log('No previous session detected, skipping auto-refresh');
      return;
    }

    set({ isLoading: true });
    try {
      // Try to restore from localStorage
      const savedToken = localStorage.getItem('accessToken');
      if (savedToken) {
        set({ accessToken: savedToken });
      }
      
      // Refresh to get fresh token + user data
      await get().refreshAccessToken();
    } catch (_err) {
      console.log('Existing session expired or invalid');
      get().setAccessToken(null); // Clears hint and token
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
      toast.error("Erreur lors de la déconnexion");
    } finally {
      set({ currentUser: null, error: null });
      get().setAccessToken(null);
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ currentUser: data });
    } catch (err) {
      console.error('Fetch me error', err);
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
        const isAuthError = err.response && [400, 401, 403].includes(err.response.status);
        if (isAuthError) {
          set({ currentUser: null });
          get().setAccessToken(null);  // ✅ Clears on refresh failure
        } else {
          console.warn("Silent refresh failed due to server or network error. Retaining credentials.");
        }
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
