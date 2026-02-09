
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";

// --- Utilities ---

export const parseAIJson = <T>(text: string): T => {
  if (!text) throw new Error("AI returned empty response.");
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1)) as T;
      } catch (innerE) {}
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)) as T;
      } catch (innerE) {}
    }
    console.error("JSON Parse Failed. Input:", text);
    throw new Error("Could not extract valid JSON from AI response.");
  }
};

export const resizeImage = async (dataUrl: string, maxSize = 800, quality = 0.7): Promise<string> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  
  let w = bitmap.width;
  let h = bitmap.height;

  if (w > maxSize || h > maxSize) {
    const ratio = Math.min(maxSize / w, maxSize / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Canvas context init failed");
  
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  await new Promise(resolve => requestAnimationFrame(resolve));

  return canvas.toDataURL('image/jpeg', quality);
};

// --- Core AI Service ---

/**
 * Retrieves the API Key from the local IndexedDB.
 * Throws if missing to prompt UI to ask user.
 */
async function getClient(): Promise<GoogleGenAI> {
  const profile = await db.userProfile.get('current_user');
  if (!profile?.apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: profile.apiKey });
}

export const analyzeImageWithRetry = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  const ai = await getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Optimized for vision
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0.2, // Low temp for factual data
        maxOutputTokens: 1000,
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    return response.text;

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    if (error.message?.includes("403") || error.message?.includes("API_KEY")) {
        throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};

export const analyzeTextPrompt = async (prompt: string): Promise<string> => {
  const ai = await getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Fast text model
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    return response.text;

  } catch (error: any) {
    if (error.message?.includes("403") || error.message?.includes("API_KEY")) {
        throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};

export const chatWithAI = async (
  message: string, 
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  const ai = await getClient();
  
  // Convert history to Gemini format
  const chatHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: chatHistory,
    config: {
      systemInstruction: "You are NutriTrack, a helpful and encouraging nutrition assistant. Keep answers concise (under 100 words) unless asked for detail. Focus on Indian context if relevant.",
    }
  });

  const result = await chat.sendMessage({ message });
  return result.text || "I'm having trouble thinking right now.";
};
