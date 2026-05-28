import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getDocumentSignedUrl = async (docId) => {
  try {
    const { data } = await apiClient.get(`/documents/${docId}/url`);
    return data.url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }
};

export const softDeleteDocument = async (docId) => {
  try {
    await apiClient.delete(`/documents/${docId}`);
    return true;
  } catch (error) {
    console.error("Soft delete document error:", error);
    throw error;
  }
};

export const uploadLegalDocument = async (file, user, category = 'Autre') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  
  const { data } = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
