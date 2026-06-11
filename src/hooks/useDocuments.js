import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { toast } from 'sonner';

// Hook pour récupérer tous les documents (cursor-based pagination)
export const useDocuments = (limit = 10, category = 'ALL', caseId = null) => {
  return useInfiniteQuery({
    queryKey: ['documents', 'infinite', limit, category, caseId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(limit), category });
      if (caseId) params.append('caseId', caseId);
      if (pageParam) params.append('cursor', pageParam);

      const { data } = await apiClient.get(`/documents?${params.toString()}`);
      return data; // { data: Document[], meta: { nextCursor, hasMore, limit } }
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    select: (result) => ({
      documents: result.pages.flatMap((p) => p.data),
      hasMore: result.pages[result.pages.length - 1]?.meta?.hasMore ?? false,
    }),
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
