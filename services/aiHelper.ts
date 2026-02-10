
import { GoogleGenAI } from "@google/genai";

// --- Utilities ---

export const parseAIJson = <T>(text: string): T => {
  if (!text) throw new Error("AI returned empty response.");
  // Remove markdown formatting if present
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Attempt to find JSON array or object if parsing failed
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try { return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1)); } catch (err) {}
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try { return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)); } catch (err) {}
    }
    throw new Error("Could not parse AI response as JSON.");
  }
};

/**
 * Mobile-robust image resizing using Canvas
 */
export const resizeImage = async (dataUrl: string, maxSize = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context unavailable");
      
      ctx.drawImage(img, 0, 0, width, height);
      // Use 0.7 quality for mobile-friendly payload size
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

// --- Core AI Service ---

/**
 * Initialize AI instance using strictly process.env.API_KEY
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImageWithRetry = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0.1, // High deterministic output for nutrition
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    return response.text;
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const analyzeTextPrompt = async (prompt: string): Promise<string> => {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    return response.text;
  } catch (error: any) {
    console.error("Gemini Text Error:", error);
    throw error;
  }
};

export const chatWithAI = async (
  message: string, 
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  const ai = getAI();
  
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      systemInstruction: "You are NutriTrack, an expert Indian food nutritionist. Keep responses under 80 words. Be encouraging and provide actionable tips.",
    }
  });

  const result = await chat.sendMessage({ message });
  return result.text || "I'm sorry, I couldn't process that.";
};
