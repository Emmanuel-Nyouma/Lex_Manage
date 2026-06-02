import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { toast } from 'sonner';

// Hook pour récupérer tous les documents
export const useDocuments = (caseId = null) => {
  return useQuery({
    queryKey: ['documents', caseId],
    queryFn: async () => {
      const url = caseId ? `/documents?caseId=${caseId}` : '/documents';
      const { data } = await apiClient.get(url);
      return data;
    },
  });
};

// Hook pour supprimer un document
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Document supprimé");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erreur de suppression");
    }
  });
};

// Hook pour récupérer les membres du cabinet (Administration)
export const useFirmMembers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users');
      return data;
    },
  });
};
