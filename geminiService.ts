
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedStack, Supplement, CategoryId } from "./types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AISearchResult {
  supplements: Supplement[];
  sources: { title: string; uri: string }[];
}

const validateSupplement = (s: any): Supplement => ({
  id: String(s.id || Math.random().toString(36).substr(2, 9)),
  name: String(s.name || 'Suplemento nuevo'),
  description: String(s.description || 'Sin descripción disponible.'),
  category: (Object.values(CategoryId).includes(s.category as CategoryId) ? s.category : CategoryId.REJUVENATION) as CategoryId,
  goals: Array.isArray(s.goals) ? s.goals.map(String) : [],
  positiveEffects: Array.isArray(s.positiveEffects) ? s.positiveEffects.map(String) : [],
  sideEffects: Array.isArray(s.sideEffects) ? s.sideEffects.map(String) : [],
  minDose: String(s.minDose || 'Consultar especialista'),
  idealDose: String(s.idealDose || 'No definida'),
  timing: String(s.timing || 'Mañana'),
  source: 'ai'
});

export const searchSupplementsAI = async (query: string): Promise<AISearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Investiga suplementos reales y nuevos descubrimientos para: "${query}". Responde solo JSON.`,
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
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                  positiveEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  idealDose: { type: Type.STRING },
                  timing: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            }
          }
        }
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk?.web?.title || 'Fuente científica',
        uri: chunk?.web?.uri || '#'
      })).filter((s: any) => s.uri !== '#') || [];

    const rawData = JSON.parse(response.text || "{\"supplements\":[]}");
    return { 
      supplements: (rawData.supplements || []).map(validateSupplement), 
      sources 
    };
  } catch (e) {
    console.error("AI Search Error:", e);
    return { supplements: [], sources: [] };
  }
};

export const generateStackAI = async (goal: string): Promise<GeneratedStack> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Diseña un protocolo científico (stack) para: "${goal}". Responde solo JSON.`,
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
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("No se pudo generar el protocolo.");
  }
};
