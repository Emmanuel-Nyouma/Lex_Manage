import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Hook pour récupérer tous les dossiers actifs
export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      // Note: Le filtrage 'deleted_at IS NULL' est déjà assuré par le RLS SQL
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook pour créer un nouveau dossier
export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCase) => {
      const { data: { user } } = await supabase.auth.getUser();
      // Import the store to get the firm_id
      const useLexStore = (await import('../store/useLexStore')).default;
      const currentUser = useLexStore.getState().currentUser;
      const firm_id = currentUser?.firm_id;

      const { data, error } = await supabase
        .from('cases')
        .insert([{ ...newCase, created_by: user.id, firm_id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success("Le dossier a été créé avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création : ${error.message}`);
    },
  });
};

// Hook pour le SOFT DELETE d'un dossier
export const useDeleteCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('cases')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success("Dossier archivé avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'archivage : ${error.message}`);
    },
  });
};
