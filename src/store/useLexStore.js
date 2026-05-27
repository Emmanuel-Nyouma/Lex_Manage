import { create } from 'zustand';
import { toast } from 'sonner';
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const useLexStore = create((set, get) => ({
  cases: [],
  clients: [],
  currentUser: null,
  session: null,
  isLoading: false,
  error: null,

  setLoading: (loading) => set({ isLoading: loading }),
  
  fetchMe: async () => {
    try {
      const { data: userData } = await apiClient.get('/api/v1/auth/me');
      set({ currentUser: userData });
    } catch (err) {
      console.error('Fetch me error', err);
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    set({ isLoading: true });
    try {
      // 1. Set session immediately to satisfy ProtectedRoute
      set({ session: { access_token: token } });
      
      // 2. Fetch user profile, but don't fail session if profile fetch fails
      await get().fetchMe(); 
    } catch (err) {
      console.error("Auth init failed", err);
      localStorage.removeItem('accessToken');
      set({ session: null, currentUser: null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/api/v1/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      set({ session: { access_token: data.accessToken }, currentUser: data.user });
      toast.success('Connexion réussie');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      localStorage.removeItem('accessToken');
      set({ currentUser: null, session: null, cases: [], clients: [], error: null });
    }
  },

  sendAiMessage: async (message) => {
    try {
      const { data } = await apiClient.post('/ai/chat', { message });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur IA";
      toast.error(msg);
      return null;
    }
  },

  callGemini: async (prompt, systemInstruction) => {
    try {
      const { data } = await apiClient.post('/ai/chat', { 
        message: prompt,
        systemInstruction // Note: Backend needs to support this or we use default
      });
      return data.text;
    } catch (err) {
      console.error("Gemini call error", err);
      return "Une erreur est survenue lors de l'appel à l'IA.";
    }
  }
}));

export default useLexStore;
