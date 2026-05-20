import { supabase } from "./supabase";
import { toast } from 'sonner';

/**
 * Fonction de retry avec exponential backoff et feedback utilisateur
 */
const fetchWithRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = error.message?.includes('429') || error.message?.includes('503');
      
      if (isRetryable && retries < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, retries);
        toast.warning(`L'IA est très sollicitée, nouvelle tentative dans ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
};

/**
 * Interroge un document via la Edge Function sécurisée
 */
export const askDocument = async (fileUri, userPrompt) => {
  return fetchWithRetry(async () => {
    const { data, error } = await supabase.functions.invoke('ask-gemini', {
      body: { 
        fileUri, 
        userPrompt,
        mimeType: "application/pdf"
      },
    });

    if (error) {
      console.error("Edge Function error:", error);
      throw new Error(error.message || "Erreur lors de l'appel à l'IA.");
    }

    return data.text;
  });
};

/**
 * Upload d'un document vers Gemini File API via Supabase Edge Function
 */
export const uploadDocumentToGemini = async (file) => {
  try {
    const { data, error } = await supabase.functions.invoke('upload-to-gemini', {
      body: file,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Upload to Gemini failed:", error);
    throw new Error("Impossible d'envoyer le document à l'IA.");
  }
};
