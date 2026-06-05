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

export const uploadLegalDocument = async (file, user, metadata = 'Autre', caseId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (typeof metadata === 'string') {
    formData.append('category', metadata);
  } else {
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.subCategory) formData.append('subCategory', metadata.subCategory);
    if (metadata.allowedRoles) {
      formData.append('allowedRoles', JSON.stringify(metadata.allowedRoles));
    }
  }
  
  if (caseId) formData.append('caseId', caseId);
  
  const { data } = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};
