import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useClients = () => {
  return useQuery({
    queryKey: QUERY_KEYS.clients,
    queryFn: async () => {
      const { data } = await apiClient.get('/clients');
      return data;
    },
  });
};
