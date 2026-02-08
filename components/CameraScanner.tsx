import React, { useRef, useEffect, useState } from 'react';
import { nutritionCalculator } from '../services/NutritionCalculator';
import { MealItem } from '../types';
import { parseAIJson, analyzeImageWithRetry, resizeImage } from '../services/aiHelper';

interface CameraScannerProps {
  onClose: () => void;
  onResult: (items: MealItem[]) => void;
  apiKey: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onResult, apiKey }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
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
    
    return () => stopCamera();
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsProcessing(false);
    setIsCaptured(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    if (videoRef.current.readyState < 2) return;

    // --- IMMEDIATE UI FEEDBACK ---
    videoRef.current.pause();
    setShutterFlash(true);
    setIsCaptured(true);
    setIsProcessing(true);
    setError(null);
    setTimeout(() => setShutterFlash(false), 150);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas init failed");

      ctx.drawImage(video, 0, 0);
      
      // Get raw image
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // OPTIMIZATION: Use helper to resize safely
      // Preserves detail for AI while preventing 4MB payload failures
      const optimizedDataUrl = await resizeImage(rawDataUrl);
      const base64Image = optimizedDataUrl.split(',')[1];

      // Robust Prompt (Shortened for token efficiency)
      const prompt = `
        Identify foods, portion grams, and nutrition (cal,prot,carb,fat,fib).
        Return JSON array: [{"name":str,"grams":num,"calories":num,"protein":num,"carbs":num,"fat":num,"fiber":num,"micros":[str]}]
      `;

      // Use Robust Wrapper (Backoff + Caching)
      const jsonText = await analyzeImageWithRetry(apiKey, base64Image, prompt);
      const rawJson = parseAIJson<any[]>(jsonText || "[]");
      const detectedItems: MealItem[] = [];

      for (const item of rawJson) {
        const cleanNum = (val: any) => {
           const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
           return isNaN(n) ? 0 : n;
        };

        const grams = cleanNum(item.grams) || 100;
        
        // Search Local DB
        const matches = nutritionCalculator.searchFoods(item.name);
        
        if (matches.length > 0) {
          const food = matches[0];
          const nutrients = nutritionCalculator.calculateNutrients(food.id, grams);
          
          detectedItems.push({
            id: Math.random().toString(36).substr(2, 9),
            foodId: food.id,
            portionGrams: grams,
            portionLabel: `${grams}g ${food.name}`,
            nutrients: { ...nutrients, micros: item.micros || [] },
            confidence: "high",
            manuallyAdded: false
          });
        } else {
          // Use AI Data
          detectedItems.push({
            id: Math.random().toString(36).substr(2, 9),
            foodId: 'ai_' + Math.random().toString(36).substr(2, 6),
            portionGrams: grams,
            portionLabel: `${grams}g ${item.name}`,
            nutrients: {
              calories: cleanNum(item.calories),
              protein: cleanNum(item.protein),
              carbs: cleanNum(item.carbs),
              fat: cleanNum(item.fat),
              fiber: cleanNum(item.fiber),
              micros: item.micros || [],
              sourceDatabase: "AI"
            },
            confidence: "medium",
            manuallyAdded: false
          });
        }
      }

      if (detectedItems.length === 0) {
        throw new Error("No food detected. Please try again.");
      }

      stopCamera();
      onResult(detectedItems);

    } catch (err: any) {
      console.error("Scanning Error:", err);
      let msg = "Analysis failed. Please try again.";
      const eStr = err.message || err.toString();
      
      if (eStr.includes("API Key")) msg = "Check API Key in Profile.";
      else if (eStr.includes("403")) msg = "Auth failed. Check API Key.";
      else if (eStr.includes("404")) msg = "AI Model unavailable.";
      else if (eStr.includes("429")) msg = "AI is busy. Please try again in 10s.";
      else if (eStr.includes("timed out")) msg = "Network too slow. Try again.";
      else if (eStr.includes("SAFETY")) msg = "Image blocked by safety filters.";
      else if (eStr.includes("No food detected")) msg = "No food identified. Try a clearer angle.";
      
      setError(msg);
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
        className={`h-full w-full object-cover transition-opacity duration-300 ${isCaptured ? 'opacity-40' : 'opacity-100'}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter Flash */}
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${shutterFlash ? 'opacity-80' : 'opacity-0'}`} />

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
        <div className="flex justify-between items-center z-50">
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all ${
             isProcessing 
               ? "bg-primary text-white border-primary animate-pulse" 
               : "bg-black/40 text-white border-white/10 backdrop-blur-md"
          }`}>
            {isProcessing ? "Processing..." : "Ready"}
          </div>
          
          <div className="w-10" />
        </div>

        <div className="relative flex-1 flex items-center justify-center">
           {isCaptured && !error && (
             <div className="absolute inset-0 flex items-center justify-center z-40">
                <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                   <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-white font-bold tracking-wide text-sm">Analyzing...</p>
                   <p className="text-white/60 text-xs">This may take a moment</p>
                </div>
             </div>
           )}

           {!isCaptured && !error && (
             <div className="w-64 h-64 border-2 border-white/30 rounded-[2rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] pointer-events-none" />
           )}

           {error && (
            <div className="absolute z-50 px-6 w-full max-w-sm">
              <div className="bg-white/10 backdrop-blur-xl border border-red-500/50 p-6 rounded-3xl text-center shadow-2xl animate-in zoom-in duration-200">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-3">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Scan Failed</h3>
                <p className="text-white/70 text-sm mb-4">{error}</p>
                <button 
                  onClick={handleRetry} 
                  className="w-full bg-white text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-100 active:scale-95 transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
           )}
        </div>

        {!isCaptured && !error && (
          <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 z-50">
            <button
              onClick={captureAndDetect}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white/20 backdrop-blur-sm"
            >
              <div className="w-16 h-16 bg-white rounded-full shadow-lg" />
            </button>
          </div>
        )}
        
        {(isCaptured || error) && <div className="h-28" />}
      </div>
    </div>
  );
};