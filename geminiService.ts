
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedStack, Supplement } from "./types.ts";

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

export const searchSupplementsAI = async (query: string): Promise<AISearchResult> => {
  const model = 'gemini-3-flash-preview'; 
  const response = await ai.models.generateContent({
    model,
    contents: `Investiga profundamente sobre: "${query}". Devuelve la información exclusivamente en formato JSON.
    Estructura JSON:
    {
      "supplements": [
        {
          "id": "slug-unico",
          "name": "Nombre",
          "description": "Descripción",
          "category": "rejuvenecimiento",
          "goals": ["objetivo1"],
          "positiveEffects": ["efecto1"],
          "sideEffects": ["efecto1"],
          "minDose": "X mg",
          "idealDose": "Y mg",
          "timing": "mañana"
        }
      ]
    }`,
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
              }
            }
          }
        }
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = Array.isArray(groundingChunks) 
    ? groundingChunks.map((chunk: any) => ({
        title: chunk?.web?.title || 'Fuente Científica',
        uri: chunk?.web?.uri || '#'
      })) 
    : [];

  try {
    const data = JSON.parse(response.text || "{}");
    const supps = (data.supplements || []).map((s: any) => ({ ...s, source: 'ai' as const }));
    return { supplements: supps, sources: sources };
  } catch (e) {
    return { supplements: [], sources: [] };
  }
};

export const generateStackAI = async (goal: string): Promise<GeneratedStack> => {
  const model = 'gemini-3-pro-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Genera una mezcla optimizada para: "${goal}". Formato JSON obligatorio.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return { ...data, items: Array.isArray(data.items) ? data.items : [] };
  } catch (e) {
    throw new Error("Error en generación.");
  }
};
