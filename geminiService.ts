
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedStack, Supplement } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AISearchResult {
  supplements: Supplement[];
  sources: { title: string; uri: string }[];
}

/**
 * Realiza una investigación profunda usando Gemini 3 Pro con Google Search Grounding
 * para encontrar suplementos basados en evidencia científica real y actual.
 */
export const searchSupplementsAI = async (query: string): Promise<AISearchResult> => {
  const model = 'gemini-3-flash-preview'; 
  const response = await ai.models.generateContent({
    model,
    contents: `Actúa como un farmacólogo clínico experto. Investiga profundamente en la web y literatura científica sobre: "${query}".
    
    Busca TODOS los suplementos efectivos para este objetivo, especialmente descubrimientos recientes.
    Para cada suplemento encontrado, extrae: dosis mínimas, dosis ideales comprobadas, efectos positivos, secundarios y el mejor momento de toma.

    IMPORTANTE: Devuelve la información exclusivamente en formato JSON siguiendo esta estructura:
    {
      "supplements": [
        {
          "id": "slug-unico",
          "name": "Nombre del Suplemento",
          "description": "Descripción detallada con base científica",
          "category": "rejuvenecimiento" | "hormonales-hombres" | "hormonales-mujeres" | "antioxidantes" | "nootropicos" | "desempeno-fisico" | "inmunidad" | "metabolismo",
          "goals": ["objetivo1", "objetivo2"],
          "positiveEffects": ["efecto1", "..."],
          "sideEffects": ["efecto1", "..."],
          "minDose": "X mg",
          "idealDose": "Y mg (basado en estudios)",
          "timing": "mañana/noche/comida"
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

  // Extraer fuentes de grounding de forma segura
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = Array.isArray(groundingChunks) 
    ? groundingChunks.map((chunk: any) => ({
        title: chunk?.web?.title || 'Fuente Científica',
        uri: chunk?.web?.uri || '#'
      })) 
    : [];

  try {
    const rawText = response.text || "{}";
    const data = JSON.parse(rawText);
    const supps = Array.isArray(data.supplements) ? data.supplements : [];
    
    // Ensure all required arrays exist on each supplement and mark as AI source
    const cleanedSupps = supps.map((s: any) => ({
      ...s,
      goals: Array.isArray(s.goals) ? s.goals : [],
      positiveEffects: Array.isArray(s.positiveEffects) ? s.positiveEffects : [],
      sideEffects: Array.isArray(s.sideEffects) ? s.sideEffects : [],
      source: 'ai' as const
    }));

    return {
      supplements: cleanedSupps,
      sources: sources
    };
  } catch (e) {
    console.error("Error parsing AI response", e);
    return { supplements: [], sources: [] };
  }
};

export const generateStackAI = async (goal: string): Promise<GeneratedStack> => {
  const model = 'gemini-3-pro-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Genera una mezcla (stack) de suplementos optimizada basada en sinergia farmacológica para el objetivo: "${goal}". 
    Investiga interacciones en la web para asegurar que la mezcla sea segura y potente.
    
    Estructura JSON:
    {
      "title": "Nombre del stack",
      "description": "Explicación científica de la sinergia",
      "items": [
        {
          "supplement": "Nombre",
          "dosage": "Dosis",
          "timing": "Toma",
          "reason": "Razón científica"
        }
      ],
      "precautions": "Advertencias importantes"
    }`,
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

  try {
    const data = JSON.parse(response.text || "{}");
    return {
      ...data,
      items: Array.isArray(data.items) ? data.items : []
    };
  } catch (e) {
    throw new Error("No se pudo generar la mezcla.");
  }
};
