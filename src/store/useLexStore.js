import { create } from 'zustand';
import { toast } from 'sonner';
import apiClient from '../lib/api';

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
    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      set({ session: { access_token: token } });
      await get().fetchMe(); 
    } catch (err) {
      console.error("Auth init failed", err);
      sessionStorage.removeItem('access_token');
      set({ session: null, currentUser: null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/api/v1/auth/login', { email, password });
      sessionStorage.setItem('access_token', data.accessToken);
      set({ session: { access_token: data.accessToken }, currentUser: data.user });
      toast.success('Login successful');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Login error');
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
      sessionStorage.removeItem('access_token');
      set({ currentUser: null, session: null, cases: [], clients: [], error: null });
    }
  },

  sendAiMessage: async (message) => {
    try {
      const { data } = await apiClient.post('/api/v1/ai/chat', { message });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "AI Error";
      toast.error(msg);
      return null;
    }
  },

  callGemini: async (prompt, systemInstruction) => {
    try {
      const { data } = await apiClient.post('/api/v1/ai/chat', { 
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
