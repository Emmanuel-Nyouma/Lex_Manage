import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const useLexStore = create((set, get) => ({
  cases: [],
  currentUser: null,
  session: null,
  isLoading: false,
  error: null,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error: error }),

  // Initialize Auth listener
  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, currentUser: session?.user ?? null });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, currentUser: session?.user ?? null });
    });
  },

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ cases: data || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Échec du chargement des dossiers');
    }
  },

  addCase: async (newCase) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('cases')
        .insert({
          ...newCase,
          user_id: get().currentUser?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      set({ cases: [data, ...get().cases], isLoading: false });
      toast.success('Dossier créé avec succès !');
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error(err.message);
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, session: null, cases: [], error: null });
    toast.success('Déconnexion réussie');
  }
}));

export default useLexStore;
