
import { GoogleGenAI } from "@google/genai";

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
 * Handles:
 * 1. Markdown code blocks (```json ... ```)
 * 2. Conversational text wrapping the JSON
 * 3. Dirty whitespace/newlines
 */
export const parseAIJson = <T>(text: string): T => {
  if (!text) throw new Error("AI returned empty response.");

  // 1. Clean Markdown Code Blocks
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // 2. Attempt Direct Parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // 3. Intelligent Extraction (Find first '[' or '{' and last ']' or '}')
    
    // Try finding an Array
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const potentialJson = cleaned.substring(firstBracket, lastBracket + 1);
        return JSON.parse(potentialJson) as T;
      } catch (e2) {
        // Continue to object check
      }
    }

    // Try finding an Object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJson = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(potentialJson) as T;
      } catch (e3) {
        // Continue to failure
      }
    }

    console.error("JSON Parse Failed. Input:", text);
    throw new Error("Could not extract valid JSON from AI response.");
  }
};
