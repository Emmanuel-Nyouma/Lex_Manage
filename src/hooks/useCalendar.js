import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useGlobalDeadlines = () => {
  return useQuery({
    queryKey: QUERY_KEYS.calendar,
    queryFn: async () => {
      const { data } = await apiClient.get('/calendar/deadlines');
      return data;
    },
  });
};
