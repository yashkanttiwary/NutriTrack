
import React, { useRef, useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { nutritionCalculator } from '../services/NutritionCalculator';
import { MealItem } from '../types';
import { parseAIJson } from '../services/aiHelper';

interface CameraScannerProps {
  onClose: () => void;
  onResult: (items: MealItem[]) => void;
  apiKey: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onResult, apiKey }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      });
      setStream(null);
    }
  };

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Camera access denied. Please check permissions.");
      }
    }
    startCamera();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      // UPDATED: Using gemini-3-pro-preview for better reasoning capabilities
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: "Identify the Indian food items on this plate. For each item, estimate the portion size in grams carefully. IMPORTANT: Include estimates for micronutrients (Iron, Calcium, Vit C, etc.) if possible. Return a JSON array of objects with keys: 'name' (string), 'grams' (number), 'micros' (array of strings). Example: [{'name': 'Paneer', 'grams': 200, 'micros': ['Calcium: 200mg']}]. Do not include units in the 'grams' field." }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      // Fixed: Use parseAIJson utility for robust parsing
      const rawJson = parseAIJson<any[]>(response.text || "[]");
      const detectedItems: MealItem[] = [];

      for (const item of rawJson) {
        // Match with local DB using fuzzy search
        const matches = nutritionCalculator.searchFoods(item.name);
        
        // Validation: Ensure grams is a valid number by stripping non-numeric chars
        // This fixes the "150gg" and "NaN" issue
        const gramsStr = String(item.grams);
        let grams = parseFloat(gramsStr.replace(/[^0-9.]/g, ''));
        
        if (isNaN(grams) || grams <= 0) {
           // Fallback to default if AI fails to give a valid number
           grams = matches.length > 0 ? matches[0].defaultPortionGrams : 100;
        }

        if (matches.length > 0) {
          const food = matches[0];
          const nutrients = nutritionCalculator.calculateNutrients(food.id, grams);
          
          detectedItems.push({
            id: Math.random().toString(36).substr(2, 9),
            foodId: food.id,
            portionGrams: grams,
            portionLabel: `${grams}g ${food.name}`,
            nutrients: {
              ...nutrients,
              micros: item.micros || [] // Append AI micros to local macros
            },
            confidence: "high",
            manuallyAdded: false
          });
        }
      }

      if (detectedItems.length === 0) {
        setError("Could not identify known Indian food items. Try a better angle.");
      } else {
        stopCamera(); // Stop camera immediately on success
        onResult(detectedItems);
      }
    } catch (err) {
      console.error(err);
      setError("AI Analysis failed. Please check your API key.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col justify-between p-8">
        <div className="flex justify-between items-center">
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl text-white text-xs font-bold uppercase tracking-widest border border-white/10">
            {isProcessing ? "Gemini Pro Analyzing..." : "Ready to Scan"}
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Viewfinder */}
        <div className="relative flex-1 flex items-center justify-center">
          <div className={`w-64 h-64 border-2 rounded-[3rem] transition-all duration-500 ${isProcessing ? 'border-primary scale-110 shadow-[0_0_50px_rgba(76,175,80,0.5)]' : 'border-white/30'}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              {isProcessing && (
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>
          {error && (
            <div className="absolute bottom-10 left-0 right-0 px-8 text-center">
              <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl text-sm font-medium animate-bounce shadow-xl">
                {error}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="text-white/60 text-sm font-medium text-center max-w-[200px]">
            Point at food and tap to analyze
          </p>
          <button
            onClick={captureAndDetect}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isProcessing ? 'border-primary bg-primary/20 scale-90' : 'border-white bg-white/10 hover:bg-white/20 active:scale-95'}`}
          >
            <div className={`w-14 h-14 rounded-full transition-all ${isProcessing ? 'bg-primary animate-pulse' : 'bg-white'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
