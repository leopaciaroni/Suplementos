
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedStack, Supplement, CategoryId } from "./types.ts";

const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface AISearchResult {
  supplements: Supplement[];
  sources: { title: string; uri: string }[];
}

const validateSupplement = (s: any): Supplement => {
  return {
    id: String(s.id || Math.random().toString(36).substr(2, 9)),
    name: String(s.name || 'Sin nombre'),
    description: String(s.description || 'Sin descripción'),
    category: (Object.values(CategoryId).includes(s.category as CategoryId) ? s.category : CategoryId.REJUVENATION) as CategoryId,
    goals: Array.isArray(s.goals) ? s.goals.map(String) : [],
    positiveEffects: Array.isArray(s.positiveEffects) ? s.positiveEffects.map(String) : [],
    sideEffects: Array.isArray(s.sideEffects) ? s.sideEffects.map(String) : [],
    minDose: String(s.minDose || 'No especificada'),
    idealDose: String(s.idealDose || 'No especificada'),
    timing: String(s.timing || 'No especificado'),
    source: 'ai'
  };
};

export const searchSupplementsAI = async (query: string): Promise<AISearchResult> => {
  const model = 'gemini-3-flash-preview'; 
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Investiga suplementos para: "${query}". Responde solo JSON.
      Categorías: rejuvenecimiento, hormonales-hombres, hormonales-mujeres, antioxidantes, nootropicos, desempeno-fisico, inmunidad, metabolismo.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                  positiveEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  minDose: { type: Type.STRING },
                  idealDose: { type: Type.STRING },
                  timing: { type: Type.STRING }
                },
                required: ["id", "name", "description", "category"]
              }
            }
          }
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = Array.isArray(groundingChunks) 
      ? groundingChunks
          .map((chunk: any) => ({
            title: chunk?.web?.title || 'Fuente Científica',
            uri: chunk?.web?.uri || '#'
          }))
          .filter(s => s.uri !== '#')
      : [];

    const rawData = JSON.parse(response.text || "{}");
    const validatedSupps = (rawData.supplements || []).map(validateSupplement);
    return { supplements: validatedSupps, sources };
  } catch (e) {
    console.error("AI Search Failed:", e);
    return { supplements: [], sources: [] };
  }
};

export const generateStackAI = async (goal: string): Promise<GeneratedStack> => {
  const model = 'gemini-3-flash-preview';
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Diseña un stack para: "${goal}". Responde solo JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  supplement: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  timing: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            precautions: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}") as GeneratedStack;
  } catch (e) {
    console.error("Stack Generation Failed:", e);
    throw new Error("Error al generar el stack.");
  }
};
