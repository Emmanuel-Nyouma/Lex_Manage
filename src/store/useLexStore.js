import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const useLexStore = create((set, get) => ({
  cases: [],
  currentUser: null, // Contiendra le profil complet (id, firm_id, role, etc.)
  session: null,
  isLoading: false,
  error: null,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error: error }),

  // Récupérer le profil complet depuis la table public.profiles
  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, firms(name)')
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ currentUser: data });
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  },

  // Initialiser l'écouteur d'authentification
  initAuth: () => {
    // 1. Check session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      set({ session });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      }
    });

    // 2. Écouter les changements d'état
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      } else {
        set({ currentUser: null });
      }
    });
  },

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ cases: data || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Échec du chargement des dossiers');
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, session: null, cases: [], error: null });
    toast.success('Déconnexion réussie');
  }
}));

export default useLexStore;
