import { GoogleGenerativeAI } from "@google/generative-ai";
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
      // 429 = Too Many Requests, 503 = Service Unavailable
      const isRetryable = error.message?.includes('429') || error.message?.includes('503');
      
      if (isRetryable && retries < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, retries);
        
        toast.warning(`L'IA est très sollicitée, nouvelle tentative dans ${delay/1000}s...`);
        console.warn(`Gemini Busy. Retry ${retries + 1} in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Interroge un document via son URI Gemini avec gestion de la résilience
 */
export const askDocument = async (fileUri, userPrompt) => {
  if (!genAI) throw new Error("Clé API Gemini manquante.");

  return fetchWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Tu es un Assistant Juridique Expert. Analyse le document et cite les sources avec précision."
    });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "application/pdf",
          fileUri: fileUri
        }
      },
      { text: userPrompt },
    ]);

    return result.response.text();
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
