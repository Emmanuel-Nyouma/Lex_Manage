import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Hook pour récupérer tous les dossiers actifs
export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cases');
      return data;
    },
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
      queryClient.invalidateQueries({ queryKey: ['cases'] });
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
      await apiClient.delete(`/cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
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
    queryKey: ['deadlines', caseId],
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
      queryClient.invalidateQueries({ queryKey: ['deadlines', caseId] });
      toast.success("Échéance ajoutée");
    },
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
      queryClient.invalidateQueries({ queryKey: ['deadlines', caseId] });
      toast.success("Échéance complétée");
    },
  });
};
