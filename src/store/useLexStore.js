import { create } from 'zustand';
import { toast } from 'sonner';
import apiClient from '../lib/api';

const useLexStore = create((set, get) => ({
  currentUser: null,
  accessToken: null, // Access token in-memory
  language: localStorage.getItem('language') || 'en',
  theme: localStorage.getItem('theme') || 'light',
  isLoading: true,
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

  setAccessToken: (token) => {
    set({ accessToken: token });
    if (token) {
      localStorage.setItem('wasLoggedIn', 'true');
    } else {
      localStorage.removeItem('wasLoggedIn');
    }
    // Remove tokens written by older versions of the application.
    localStorage.removeItem('accessToken');
  },

  initAuth: async () => {
    if (get().isRefreshing) return;

    set({ isLoading: true });
    try {
      await get().refreshAccessToken();
    } catch {
      set({ currentUser: null, accessToken: null });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('wasLoggedIn');
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ UPDATED: Use new setAccessToken
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      get().setAccessToken(data.accessToken);
      set({ currentUser: data.user });
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
      return data;
    } catch (err) {
      console.error('Fetch me error', err);
      if ([401, 403].includes(err.response?.status)) {
        set({ currentUser: null, accessToken: null });
        localStorage.removeItem('wasLoggedIn');
      }
      throw err;
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
        get().setAccessToken(data.accessToken);
        // The /auth/refresh response does NOT include the user object. Only update
        // currentUser when one is actually returned; otherwise keep the existing
        // profile (post-login) or hydrate it from /auth/me (e.g. after a page reload).
        if (data.user) {
          set({ currentUser: data.user });
        } else if (!get().currentUser) {
          await get().fetchMe();
        }
        return data.accessToken;
      } catch (err) {
        const isAuthError = err.response && [400, 401, 403].includes(err.response.status);
        if (isAuthError) {
          set({ currentUser: null });
          get().setAccessToken(null);
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
