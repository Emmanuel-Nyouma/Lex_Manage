import { supabase } from './supabase';

/**
 * Service pour gérer l'upload double (Storage + Gemini)
 */
export const uploadLegalDocument = async (file, userId) => {
  if (!file || !userId) throw new Error("Paramètres manquants pour l'upload");

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // 1. Upload vers Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('documents') // Assurez-vous que le bucket s'appelle 'documents'
    .upload(filePath, file);

  if (storageError) throw storageError;

  // 2. Upload vers Gemini File API (via Edge Function)
  const { data: geminiData, error: geminiError } = await supabase.functions.invoke('upload-to-gemini', {
    body: file,
  });

  if (geminiError) throw geminiError;

  // 3. Insertion DB
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: file.name,
      storage_path: filePath,
      gemini_file_uri: geminiData.uri,
      gemini_file_name: geminiData.name,
      user_id: userId,
      folder: 'Client Matters',
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: fileExt.toUpperCase(),
      author: 'Moi' // Sera complété par le profil en DB
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};
