import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Hook pour récupérer tous les dossiers
export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
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
      const { data, error } = await supabase
        .from('cases')
        .insert([{ ...newCase, user_id: user.id }])
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
