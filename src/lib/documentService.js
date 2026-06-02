import apiClient from './api';

export const getDocumentSignedUrl = async (docId) => {
  try {
    const { data } = await apiClient.get(`/documents/${docId}/download-url`);
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

export const uploadLegalDocument = async (file, user, category = 'Autre', caseId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (caseId) formData.append('caseId', caseId);
  
  const { data } = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
