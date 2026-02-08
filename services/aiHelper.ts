
/**
 * Utility to clean and parse JSON responses from AI models.
 * Models often wrap JSON in Markdown code blocks (```json ... ```), 
 * which causes JSON.parse to fail.
 */
export const cleanJsonText = (text: string): string => {
  if (!text) return "[]";
  
  // Remove markdown code blocks like ```json ... ``` or just ``` ... ```
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "");
  
  // Trim whitespace
  return cleaned.trim();
};

export const parseAIJson = <T>(text: string): T => {
  const cleaned = cleanJsonText(text);
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    
    // Fallback: Attempt to find array or object start/end if extra text exists
    // This handles cases where the AI adds conversational text before/after the JSON
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T;
      } catch (e2) {
        // Continue to throw original error if fallback fails
      }
    }
    
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch (e2) {
         // Continue to throw original error if fallback fails
      }
    }
    
    throw new Error("Failed to parse AI response. The model may have returned invalid JSON.");
  }
};
