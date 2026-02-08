import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, MealItem } from '../types';
import { nutritionCalculator } from '../services/NutritionCalculator';
import { createGenAIClient, parseAIJson } from '../services/aiHelper';
import { Icons } from './Icons';

interface ManualEntryModalProps {
  onClose: () => void;
  onAdd: (items: MealItem[]) => void;
  apiKey: string;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onAdd, apiKey }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100); // grams
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search logic
  useEffect(() => {
    if (query.trim().length > 1 && !selectedImage && !isAnalyzing) {
      setResults(nutritionCalculator.searchFoods(query));
    } else {
      setResults([]);
    }
  }, [query, selectedImage, isAnalyzing]);

  // Fix HIGH-001: Reset quantity when food is selected
  useEffect(() => {
    if (selectedFood) {
      setQuantity(selectedFood.defaultPortionGrams);
    }
  }, [selectedFood]);

  const handleLocalAdd = () => {
    if (!selectedFood) return;
    
    // Fix CRIT-001: Catch sanity check errors
    try {
      const nutrients = nutritionCalculator.calculateNutrients(selectedFood.id, quantity);
      const item: MealItem = {
        id: Math.random().toString(36).substr(2, 9),
        foodId: selectedFood.id,
        portionGrams: quantity,
        portionLabel: `${quantity}g ${selectedFood.name}`,
        nutrients: nutrients,
        confidence: "high",
        manuallyAdded: true
      };
      onAdd([item]);
    } catch (error: any) {
      alert(error.message || "Failed to calculate nutrients. Please check the quantity.");
      console.error("Calculation failed:", error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_DIMENSION = 768;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
          } else {
              resolve(dataUrl); 
          }
        } catch (e) {
          console.error("Image resizing failed:", e);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const analyzeWithAI = async () => {
    if ((!query && !selectedImage) || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const ai = createGenAIClient(apiKey);
      
      const parts: any[] = [];
      if (selectedImage) {
        const resizedImage = await resizeImage(selectedImage);
        const data = resizedImage.split(',')[1];
        
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg', 
            data: data
          }
        });
      }
      
      const promptText = `
        Analyze this meal. Text description: "${query}". 
        Identify all food items. For each item, estimate the weight in grams and provide nutrition data.
        
        Return a JSON array with keys: 
        name (string), 
        grams (number), 
        calories (number), 
        protein (number), 
        carbs (number), 
        fat (number), 
        fiber (number),
        micros (array of strings).
      `;
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts }],
        config: { responseMimeType: "application/json" }
      });

      const rawJson = parseAIJson<any[]>(response.text || "[]");
      
      const items: MealItem[] = rawJson.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        foodId: 'ai_' + Math.random().toString(36).substr(2, 5),
        portionGrams: item.grams,
        portionLabel: `${item.grams}g ${item.name}`,
        nutrients: {
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          micros: item.micros || [],
          sourceDatabase: "AI"
        },
        confidence: "medium",
        manuallyAdded: true
      }));

      if (items.length > 0) {
        onAdd(items);
      } else {
        alert("AI could not identify any food. Please try again or add more description.");
      }

    } catch (error: any) {
      console.error("AI Error:", error);
      const msg = error.message || String(error);
      
      if (msg.includes("API Key")) {
         alert("Authentication failed: " + msg);
      } else if (msg.includes("403")) {
         alert("Authentication failed. Please check your Gemini API Key in Profile.");
      } else if (msg.includes("413") || msg.includes("payload")) {
         alert("Image is too large. The system attempted to resize it but it's still too big. Try a smaller image.");
      } else {
         alert(`Failed to analyze meal. Error: ${msg}.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg md:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col relative overflow-hidden transition-all">
        
        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
             <div className="w-20 h-20 relative mb-6">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                   <Icons.Search />
                </div>
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Meal...</h3>
             <p className="text-gray-500 text-sm">Identifying foods & calculating nutrients</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Log Meal</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><Icons.X /></button>
        </div>

        {!selectedFood ? (
          <>
            {/* Smart Input Section */}
            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 mb-4 sm:mb-6 transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 shrink-0">
              <textarea
                placeholder="Describe your meal (e.g. '2 idli with sambar') or search database..."
                className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 resize-none h-20 text-base sm:text-lg leading-relaxed"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              
              {selectedImage && (
                <div className="relative mt-2 mb-4 w-16 h-16 sm:w-20 sm:h-20">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500 scale-75 sm:scale-100"
                  >
                    <Icons.X />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-primary bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-green-50 transition-colors"
                  >
                    <Icons.Image />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </div>
                
                <button 
                  onClick={analyzeWithAI}
                  disabled={isAnalyzing || (!query && !selectedImage)}
                  className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold text-sm sm:text-base transition-all ${
                    isAnalyzing || (!query && !selectedImage)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white shadow-lg shadow-green-100 hover:scale-105 active:scale-95'
                  }`}
                >
                  Analyze <Icons.Send />
                </button>
              </div>
            </div>

            {/* Local DB Search Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {results.length > 0 && (
                <div className="space-y-2">
                  <div className="px-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Add from Database</div>
                  {results.map(food => (
                    <div 
                      key={food.id} 
                      onClick={() => setSelectedFood(food)}
                      className="p-3 sm:p-4 rounded-2xl hover:bg-green-50 active:bg-green-100 cursor-pointer border border-transparent hover:border-green-100 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-primary transition-colors">{food.name}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{food.defaultPortionGrams}g • {Math.round(food.nutrientsPerGram.calories * food.defaultPortionGrams)} kcal</div>
                      </div>
                      <div className="text-gray-300 group-hover:text-primary transition-colors">
                        <Icons.Plus />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.length === 0 && query.length > 1 && !isAnalyzing && !selectedImage && (
                <div className="text-center mt-12 px-4">
                   <p className="text-gray-400 font-medium text-sm">No direct database matches.</p>
                   <p className="text-gray-300 text-xs mt-1">Tap <span className="font-bold text-primary">Analyze</span> to let AI handle it.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Food Quantity Adjustment View */
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{selectedFood.name}</h4>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">{selectedFood.category}</p>
              
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setQuantity(Math.max(10, quantity - 10))}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-600 active:bg-gray-200"
                >-</button>
                <div className="flex-1 text-center">
                  <div className="text-3xl sm:text-4xl font-black text-primary">{quantity}</div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Grams</div>
                </div>
                <button 
                  onClick={() => setQuantity(quantity + 10)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-600 active:bg-gray-200"
                >+</button>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">Calories</div>
                  <div className="text-lg sm:text-xl font-black text-gray-800">
                    {Math.round(selectedFood.nutrientsPerGram.calories * quantity)}
                  </div>
                </div>
                 <div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">Protein</div>
                  <div className="text-lg sm:text-xl font-black text-gray-800">
                    {(selectedFood.nutrientsPerGram.protein * quantity).toFixed(1)}g
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 pt-4 mt-auto">
              <button onClick={() => setSelectedFood(null)} className="flex-1 py-3 sm:py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 text-sm sm:text-base">Back</button>
              <button onClick={handleLocalAdd} className="flex-[2] py-3 sm:py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 text-sm sm:text-base">Add Meal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
