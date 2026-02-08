import { GoogleGenAI } from "@google/genai";
import { db } from "./db";

/**
 * Creates a validated GoogleGenAI client instance.
 * Throws descriptive errors if the API key is missing or invalid.
 */
export const createGenAIClient = (apiKey: string): GoogleGenAI => {
  const cleanKey = apiKey ? apiKey.trim() : "";
  
  if (!cleanKey) {
    throw new Error("API Key is missing. Please configure it in your Profile settings.");
  }
  
  if (cleanKey.length < 10) {
    throw new Error("API Key appears to be invalid. Please check your Profile settings.");
  }

  return new GoogleGenAI({ apiKey: cleanKey });
};

/**
 * Utility to robustly parse JSON from AI models.
 */
export const parseAIJson = <T>(text: string): T => {
  if (!text) throw new Error("AI returned empty response.");

  // 1. Clean Markdown Code Blocks
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // 2. Attempt Direct Parse
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 3. Intelligent Extraction (Find first '[' or '{' and last ']' or '}')
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const potentialJson = cleaned.substring(firstBracket, lastBracket + 1);
        return JSON.parse(potentialJson) as T;
      } catch {}
    }

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJson = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(potentialJson) as T;
      } catch {}
    }

    console.error("JSON Parse Failed. Input:", text);
    throw new Error("Could not extract valid JSON from AI response.");
  }
};

/**
 * HIGH-FIDELITY OPTIMIZATION
 * Resizes image to max 1280px (HD) at 0.8 quality.
 * Preserves detail while significantly reducing payload size compared to raw 12MP photos.
 */
export const resizeImage = (dataUrl: string, maxSize = 1280, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      
      // Calculate new dimensions ensuring aspect ratio
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          return reject(new Error("Canvas context initialization failed"));
      }

      // Use better interpolation if browser supports it
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error("Image load failed for resizing"));
    img.src = dataUrl;
  });
};

/**
 * Generates a SHA-256 hash of the input for caching purposes.
 * This ensures we don't re-process the exact same image + prompt combination.
 */
async function generateRequestHash(prompt: string, imageBase64: string): Promise<string> {
  // Use first 5kb of image string + length + prompt to create unique key
  // We use partial string to keep hashing fast, length prevents collision on patterns
  const keyData = prompt + imageBase64.length + imageBase64.slice(0, 5000) + imageBase64.slice(-100);
  
  const msgBuffer = new TextEncoder().encode(keyData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ROBUST API CALL WRAPPER
 * Implements:
 * 1. Caching (Idempotency)
 * 2. Exponential Backoff
 * 3. Jitter
 * 4. Automatic retry on 429/503
 */
export const analyzeImageWithRetry = async (
  apiKey: string,
  imageBase64: string,
  prompt: string,
  modelName: string = 'gemini-3-flash-preview'
): Promise<string> => {
  
  // 1. Check Cache
  const hashKey = await generateRequestHash(modelName + prompt, imageBase64);
  const cached = await db.apiCache.get(hashKey);
  
  // Return cached if less than 24 hours old
  if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60 * 24)) {
    console.log("⚡ Returning cached AI response");
    return cached.response;
  }

  const ai = createGenAIClient(apiKey);
  const maxRetries = 3;
  const baseDelay = 1000;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
              { text: prompt }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      // 2. Save to Cache on Success
      await db.apiCache.put({
        hash: hashKey,
        response: text,
        timestamp: Date.now()
      });

      return text;

    } catch (error: any) {
      const msg = error.message || String(error);
      const isRetryable = msg.includes("429") || msg.includes("503") || msg.includes("500") || msg.includes("fetch failed");

      if (attempt === maxRetries || !isRetryable) {
        throw error; // Fatal error or max retries reached
      }

      // 3. Exponential Backoff with Jitter
      // Delay = Base * 2^attempt + random_jitter
      const delay = baseDelay * Math.pow(2, attempt) + (Math.random() * 500);
      
      console.warn(`⚠️ API Request failed (Attempt ${attempt + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms... Error: ${msg}`);
      await wait(delay);
      attempt++;
    }
  }
  
  throw new Error("Maximum retries exceeded. Please check your internet connection.");
};