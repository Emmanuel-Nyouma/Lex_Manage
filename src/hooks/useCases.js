import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { QUERY_KEYS } from '../lib/queryKeys';
import { toast } from 'sonner';

// Hook pour récupérer tous les dossiers actifs
export const useCases = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.cases, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/cases?page=${page}&limit=${limit}`);
      return data;
    },
    keepPreviousData: true,
  });
};

// Hook pour créer un nouveau dossier
export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCase) => {
      const { data } = await apiClient.post('/api/v1/cases', newCase);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases });
      toast.success("Le dossier a été créé avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création : ${error.response?.data?.message || error.message}`);
    },
  });
};

// Hook pour supprimer un dossier
export const useDeleteCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/v1/cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases });
      toast.success("Dossier supprimé avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression : ${error.response?.data?.message || error.message}`);
    },
  });
};

// Hook pour récupérer les délais d'un dossier
export const useDeadlines = (caseId) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.cases, caseId, 'deadlines'],
    queryFn: async () => {
      if (!caseId) return [];
      const { data } = await apiClient.get(`/api/v1/cases/${caseId}/deadlines`);
      return data;
    },
    enabled: !!caseId,
  });
};

// Hook pour créer un délai
export const useCreateDeadline = (caseId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDeadline) => {
      const { data } = await apiClient.post(`/api/v1/cases/${caseId}/deadlines`, newDeadline);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.cases, caseId, 'deadlines'] });
      toast.success("Échéance ajoutée");
    },
  });
};

// Hook pour marquer un délai comme fait
export const useMarkDeadlineDone = (caseId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.patch(`/api/v1/cases/${caseId}/deadlines/${id}/done`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.cases, caseId, 'deadlines'] });
      toast.success("Échéance complétée");
    },
  });
};
