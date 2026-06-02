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

  setAccessToken: (token) => set({ accessToken: token }),

  initAuth: async () => {
    if (get().isRefreshing) return;
    set({ isLoading: true });
    try {
      await get().refreshAccessToken();
    } catch (err) {
      console.log('No existing session found');
    } finally {
      set({ isLoading: false });
    }
  },

  refreshAccessToken: async () => {
    if (get().isRefreshing) {
      return get().refreshPromise;
    }

    const refreshPromise = (async () => {
      set({ isRefreshing: true });
      try {
        const { data } = await apiClient.post('/auth/refresh');
        set({ accessToken: data.accessToken, currentUser: data.user });
        return data.accessToken;
      } catch (err) {
        set({ currentUser: null, accessToken: null });
        throw err;
      } finally {
        set({ isRefreshing: false, refreshPromise: null });
      }
    })();

    set({ refreshPromise });
    return refreshPromise;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      set({ accessToken: data.accessToken, currentUser: data.user });
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      set({ currentUser: null, accessToken: null, error: null });
    }
  },

  sendAiMessage: async (message) => {
    try {
      const { data } = await apiClient.post('/ai/chat', { message });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "AI Error";
      toast.error(msg);
      return null;
    }
  },

  callGemini: async (prompt, systemInstruction) => {
    try {
      const { data } = await apiClient.post('/ai/chat', { 
        message: prompt,
        systemInstruction
      });
      return data.text;
    } catch (err) {
      console.error("Gemini call error", err);
      return "An error occurred during the AI call.";
    }
  }
}));

export default useLexStore;
