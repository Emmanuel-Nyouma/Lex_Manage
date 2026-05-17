import { supabase } from './supabase';

/**
 * Génère une URL sécurisée temporaire (60s)
 */
export const getDocumentSignedUrl = async (storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 60);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }
};

/**
 * SOFT DELETE d'un document (Marquage en DB uniquement)
 */
export const softDeleteDocument = async (docId) => {
  try {
    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', docId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Soft delete document error:", error);
    throw error;
  }
};

/**
 * Upload multi-tenant (firm_id/user_id/file)
 */
export const uploadLegalDocument = async (file, user) => {
  if (!file || !user) throw new Error("Paramètres manquants");

  // On récupère le firm_id du profil
  const { data: profile } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single();
  const firmId = profile?.firm_id;
  
  if (!firmId) throw new Error("Accès interdit : Cabinet non identifié");

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${firmId}/${user.id}/${fileName}`;

  // 1. Upload Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (storageError) throw storageError;

  // 2. IA Analyse (Edge Function)
  const { data: geminiData } = await supabase.functions.invoke('upload-to-gemini', {
    body: file,
  });

  // 3. Insertion DB
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: file.name,
      storage_path: filePath,
      firm_id: firmId,
      user_id: user.id,
      gemini_file_uri: geminiData?.uri,
      gemini_file_name: geminiData?.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: fileExt.toUpperCase()
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};
