import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const useIngestToLexAssist = () => {
  return useMutation({
    mutationFn: async (documentId) => {
      const { data } = await apiClient.post('/ai/ingest-document', { documentId });
      if (!data?.success) {
        throw new Error(data?.message || "L'ingestion a échoué");
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Document envoyé à LexAssist AI ✓');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Échec de l'envoi à LexAssist AI");
    },
  });
};
