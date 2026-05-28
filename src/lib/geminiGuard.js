import apiClient from './api';

export const ensureGeminiFileActive = async (docId) => {
  const { data } = await apiClient.get(`/api/v1/documents/${docId}`);
  return data.geminiFileUri;
};
