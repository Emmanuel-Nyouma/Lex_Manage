import { supabase } from './supabase';

/**
 * Vérifie et rafraîchit le lien Gemini si expiré (seuil 44h)
 */
export const ensureGeminiFileActive = async (docId) => {
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', docId)
    .single();

  if (error || !doc) throw new Error("Document introuvable");

  const now = new Date();
  const uploadDate = new Date(doc.updated_at || doc.created_at);
  const hoursSinceUpload = (now - uploadDate) / (1000 * 60 * 60);

  // Gemini supprime après 48h. Sécurité à 44h.
  if (hoursSinceUpload < 44 && doc.gemini_file_uri) {
    return doc.gemini_file_uri;
  }

  console.log("Gemini File expiré. Ré-upload depuis Storage...");

  // 1. Récupérer le binaire
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('documents')
    .download(doc.storage_path);

  if (downloadError) throw downloadError;

  // 2. Ré-uploader
  const { data: geminiData, error: geminiError } = await supabase.functions.invoke('upload-to-gemini', {
    body: fileData,
  });

  if (geminiError) throw geminiError;

  // 3. Update DB
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      gemini_file_uri: geminiData.uri,
      gemini_file_name: geminiData.name,
      updated_at: new Date().toISOString()
    })
    .eq('id', docId);

  if (updateError) throw updateError;

  return geminiData.uri;
};
