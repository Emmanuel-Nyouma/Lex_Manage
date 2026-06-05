import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

// List of the current user's conversations (most recent first)
export const useConversations = () =>
  useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => (await apiClient.get('/chat/conversations')).data,
  });

// Direct calls for conversation / message operations
export const chatApi = {
  create: () => apiClient.post('/chat/conversations').then((r) => r.data),
  get: (id) => apiClient.get(`/chat/conversations/${id}`).then((r) => r.data),
  send: (id, message) =>
    apiClient.post(`/chat/conversations/${id}/messages`, { message }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/chat/conversations/${id}`).then((r) => r.data),
};
