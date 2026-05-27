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
  // Supabase removed - defaulting to mock response
  return "Réponse de simulation de l'IA (Supabase déconnecté).";
};

/**
 * Upload d'un document vers Gemini File API via Supabase Edge Function
 */
export const uploadDocumentToGemini = async (file) => {
  // Supabase removed - defaulting to mock data
  return { uri: 'mock-uri' };
};
