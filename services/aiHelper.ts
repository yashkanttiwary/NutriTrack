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
 * Handles Markdown fences, conversational wrappers, and partial failures.
 */
export const parseAIJson = <T>(text: string): T => {
  if (!text) throw new Error("AI returned empty response.");

  // 1. Clean Markdown Code Blocks
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // 2. Attempt Direct Parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // 3. Intelligent Extraction (Find the outer-most array)
    // This handles cases where AI says: "Here is the data: [...]"
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const potentialJson = cleaned.substring(firstBracket, lastBracket + 1);
        return JSON.parse(potentialJson) as T;
      } catch (innerE) {
        // Continue to object extraction
      }
    }

    // 4. Object Extraction (Find the outer-most object)
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJson = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(potentialJson) as T;
      } catch (innerE) {
        // Continue to error
      }
    }

    console.error("JSON Parse Failed. Input:", text);
    throw new Error("Could not extract valid JSON from AI response.");
  }
};

/**
 * HIGH-FIDELITY OPTIMIZATION
 * Resizes image to max 800px at 0.7 quality.
 * 
 * WHY 800px?
 * Gemini Flash Vision performs excellently even at 512px-800px.
 * Reducing from 1024px to 800px reduces pixel count by ~40%,
 * drastically speeding up upload and reducing "Busy" errors.
 */
export const resizeImage = (dataUrl: string, maxSize = 800, quality = 0.7): Promise<string> => {
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

      // Use better interpolation
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
 */
async function generateRequestHash(prompt: string, imageBase64: string): Promise<string> {
  // Hash the prompt + a sample of the image to be efficient
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
 * 2. Exponential Backoff with High Base Delay (friendly to Rate Limits)
 * 3. Client-side Timeout (prevents hanging)
 * 4. Safety Check Handling
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
  // Increased base delay to 2s to better handle strict rate limits
  const baseDelay = 2000; 
  // 30s timeout for mobile networks
  const TIMEOUT_MS = 30000; 
  
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), TIMEOUT_MS)
      );

      // Create the API promise
      const apiPromise = ai.models.generateContent({
        model: modelName,
        contents: [
          {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
              { text: prompt }
            ]
          }
        ],
        config: { 
          responseMimeType: "application/json",
          // Add safety settings if necessary, though defaults are usually fine
        }
      });

      // Race against the timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      // Safety Block Check
      if (!response.text && response.candidates && response.candidates[0]?.finishReason) {
        const reason = response.candidates[0].finishReason;
        if (reason === 'SAFETY' || reason === 'BLOCKLIST') {
          throw new Error(`AI blocked this image for safety reasons (${reason}).`);
        }
      }

      const text = response.text;
      if (!text) throw new Error("Empty response from AI (No text generated).");

      // 2. Save to Cache on Success
      await db.apiCache.put({
        hash: hashKey,
        response: text,
        timestamp: Date.now()
      });

      return text;

    } catch (error: any) {
      const msg = error.message || String(error);
      
      // Determine if retryable
      const isRateLimit = msg.includes("429") || msg.includes("Quota");
      const isServerOverload = msg.includes("503") || msg.includes("500") || msg.includes("overloaded");
      const isNetworkError = msg.includes("fetch failed") || msg.includes("network") || msg.includes("timed out");
      
      // Non-retryable errors
      if (msg.includes("API Key") || msg.includes("403") || msg.includes("SAFETY")) {
        throw error;
      }

      const isRetryable = isRateLimit || isServerOverload || isNetworkError;

      if (attempt === maxRetries || !isRetryable) {
        console.error("Fatal API Error:", error);
        throw error;
      }

      // 3. Exponential Backoff with Jitter
      // Delay = Base * 2^attempt + random_jitter
      const delay = baseDelay * Math.pow(2, attempt) + (Math.random() * 1000);
      
      console.warn(`⚠️ API Request failed (Attempt ${attempt + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms... Error: ${msg}`);
      await wait(delay);
      attempt++;
    }
  }
  
  throw new Error("Maximum retries exceeded. The server is busy or connection is unstable.");
};