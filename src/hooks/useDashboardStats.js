import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/stats/dashboard');
      return data;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
