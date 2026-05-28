import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
  });
};
