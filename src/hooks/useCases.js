import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { QUERY_KEYS } from '../lib/queryKeys';
import { toast } from 'sonner';

// Standardized error handler
const handleMutationError = (error, defaultMessage) => {
  const message = error.response?.data?.message || error.message || defaultMessage;
  toast.error(`Erreur: ${message}`);
  console.error("Mutation Error:", error);
};

// Hook pour récupérer les collègues du cabinet avec leurs dossiers actifs
export const useColleagues = () => {
  return useQuery({
    queryKey: ['colleagues'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/colleagues');
      return data;
    },
    staleTime: 60000,
  });
};

// Hook pour récupérer tous les dossiers actifs (cursor-based pagination)
export const useCases = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.cases, 'infinite', limit],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (pageParam) params.append('cursor', pageParam);
      const { data } = await apiClient.get(`/cases?${params.toString()}`);
      return data; // { data: Case[], meta: { nextCursor, hasMore, limit } }
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    select: (result) => ({
      cases: result.pages.flatMap((p) => p.data),
      hasMore: result.pages[result.pages.length - 1]?.meta?.hasMore ?? false,
    }),
  });
};

// Hook pour créer un nouveau dossier
export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCase) => {
      const { data } = await apiClient.post('/cases', newCase);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases });
      toast.success("Le dossier a été créé avec succès");
    },
    onError: (err) => handleMutationError(err, "Erreur lors de la création du dossier"),
  });
};

// Hook pour supprimer un dossier
export const useDeleteCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases });
      toast.success("Dossier supprimé avec succès");
    },
    onError: (err) => handleMutationError(err, "Erreur lors de la suppression"),
  });
};

// Hook pour récupérer les délais d'un dossier
export const useDeadlines = (caseId) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.cases, caseId, 'deadlines'],
    queryFn: async () => {
      if (!caseId) return [];
      const { data } = await apiClient.get(`/cases/${caseId}/deadlines`);
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
      const { data } = await apiClient.post(`/cases/${caseId}/deadlines`, newDeadline);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.cases, caseId, 'deadlines'] });
      toast.success("Échéance ajoutée");
    },
    onError: (err) => handleMutationError(err, "Erreur lors de l'ajout de l'échéance"),
  });
};

// Hook pour marquer un délai comme fait
export const useMarkDeadlineDone = (caseId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.patch(`/cases/${caseId}/deadlines/${id}/done`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.cases, caseId, 'deadlines'] });
      toast.success("Échéance complétée");
    },
    onError: (err) => handleMutationError(err, "Erreur lors de la mise à jour de l'échéance"),
  });
};

// Hook pour supprimer un délai
export const useDeleteDeadline = (caseId = 'none') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      // Use the provided caseId or default to 'none' for global events
      const targetId = caseId || 'none';
      await apiClient.delete(`/cases/${targetId}/deadlines/${id}`);
    },
    onSuccess: (_data, _variables, _context) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.cases, caseId, 'deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-deadlines'] });
      toast.success("Échéance supprimée");
    },
    onError: (err) => handleMutationError(err, "Erreur lors de la suppression"),
  });
};
