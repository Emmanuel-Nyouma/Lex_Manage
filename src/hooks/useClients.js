import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { QUERY_KEYS } from '../lib/queryKeys';
import { toast } from 'sonner';

const clientsKey = QUERY_KEYS.clients;

export const useClients = () => {
  return useQuery({
    queryKey: QUERY_KEYS.clients,
    queryFn: async () => {
      const { data } = await apiClient.get('/clients');
      return data;
    },
  });
};

export const useClient = (id) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients, id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/clients', payload);
      return data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: clientsKey });
      const previous = queryClient.getQueryData(clientsKey);
      queryClient.setQueryData(clientsKey, (clients = []) => [{
        ...payload,
        id: `optimistic-${Date.now()}`,
        createdAt: new Date().toISOString(),
        _optimistic: true,
      }, ...clients]);
      return { previous };
    },
    onSuccess: () => {
      toast.success('Client created successfully');
    },
    onError: (error, _payload, context) => {
      queryClient.setQueryData(clientsKey, context?.previous);
      toast.error(error.response?.data?.message || 'Failed to create client');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await apiClient.patch(`/clients/${id}`, payload);
      return data;
    },
    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey: clientsKey });
      const previous = queryClient.getQueryData(clientsKey);
      queryClient.setQueryData(clientsKey, (clients = []) => clients.map((client) => (
        client.id === id ? { ...client, ...payload, _optimistic: true } : client
      )));
      return { previous };
    },
    onSuccess: () => {
      toast.success('Client updated successfully');
    },
    onError: (error, _payload, context) => {
      queryClient.setQueryData(clientsKey, context?.previous);
      toast.error(error.response?.data?.message || 'Failed to update client');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/clients/${id}`);
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: clientsKey });
      const previous = queryClient.getQueryData(clientsKey);
      queryClient.setQueryData(clientsKey, (clients = []) => clients.filter((client) => client.id !== id));
      return { previous };
    },
    onSuccess: () => {
      toast.success('Client deleted successfully');
    },
    onError: (error, _id, context) => {
      queryClient.setQueryData(clientsKey, context?.previous);
      toast.error(error.response?.data?.message || 'Failed to delete client');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey });
    },
  });
};
