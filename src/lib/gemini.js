import apiClient from './api';

export const askDocument = async (fileUri, userPrompt) => {
  const { data } = await apiClient.post('/api/v1/ai/chat', {
    message: userPrompt,
    context: `Document URI: ${fileUri}`
  });
  return data.text;
};

export const uploadDocumentToGemini = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/api/v1/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return { uri: data.geminiFileUri };
};
