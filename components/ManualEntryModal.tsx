
import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, MealItem } from '../types';
import { nutritionCalculator } from '../services/NutritionCalculator';
import { parseAIJson, analyzeImageWithRetry, resizeImage, analyzeTextPrompt } from '../services/aiHelper';
import { Icons } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface ManualEntryModalProps {
  onClose: () => void;
  onAdd: (items: MealItem[]) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onAdd }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (query.trim().length > 1 && !selectedImage && !isAnalyzing) {
      setResults(nutritionCalculator.searchFoods(query));
    } else {
      setResults([]);
    }
  }, [query, selectedImage, isAnalyzing]);

  useEffect(() => {
    if (selectedFood) {
      setQuantity(selectedFood.defaultPortionGrams);
    }
  }, [selectedFood]);

  const handleLocalAdd = () => {
    if (!selectedFood) return;
    try {
      const nutrients = nutritionCalculator.calculateNutrients(selectedFood.id, quantity);
      onAdd([{
        id: crypto.randomUUID(),
        foodId: selectedFood.id,
        portionGrams: quantity,
        portionLabel: `${quantity}g ${selectedFood.name}`,
        nutrients,
        confidence: "high",
        manuallyAdded: true
      }]);
    } catch (error: any) {
      showToast(error.message || "Failed to calculate nutrients", "error");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = '';
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const optimized = await resizeImage(reader.result as string, 1024);
          setSelectedImage(optimized);
        } catch (err) {
          showToast("Image processing failed.", "error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeWithAI = async () => {
    if ((!query && !selectedImage) || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      let jsonText = "";
      const jsonPrompt = `Identify food items. Return strictly JSON array: [{"name": string, "grams": number, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "micros": string[]}].`;

      if (selectedImage) {
        const imageBase64 = selectedImage.split(',')[1];
        jsonText = await analyzeImageWithRetry(imageBase64, `Identify this meal. Context: ${query}. ${jsonPrompt}`);
      } else {
        jsonText = await analyzeTextPrompt(`Analyze: ${query}. ${jsonPrompt}`);
      }

      const rawJson = parseAIJson<any[]>(jsonText);
      const items: MealItem[] = rawJson.map((item: any) => ({
        id: crypto.randomUUID(),
        foodId: 'ai_' + Math.random().toString(36).substr(2, 5),
        portionGrams: item.grams || 100,
        portionLabel: `${item.grams || 100}g ${item.name}`,
        nutrients: {
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          fiber: item.fiber || 0,
          micros: item.micros || [],
          sourceDatabase: "AI"
        },
        confidence: "medium",
        manuallyAdded: true
      }));

      if (items.length > 0) onAdd(items);
      else throw new Error("No food found.");
    } catch (error: any) {
      console.error("Analysis Error:", error);
      showToast("Analysis failed. Try a clearer description or photo.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl flex flex-col relative overflow-hidden">
        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-white/90 flex flex-col items-center justify-center">
             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
             <p className="font-bold text-gray-900">Identifying food...</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Meal</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><Icons.X /></button>
        </div>

        {!selectedFood ? (
          <>
            <div className="bg-gray-50 p-4 rounded-3xl mb-4">
              <textarea
                placeholder="Describe your meal (e.g. '2 idli with sambar')"
                className="w-full bg-transparent border-none focus:ring-0 text-gray-800 h-20"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {selectedImage && <img src={selectedImage} className="w-20 h-20 object-cover rounded-xl mt-2" />}
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <button onClick={() => cameraInputRef.current?.click()} className="p-2 bg-white rounded-xl shadow-sm text-primary"><Icons.Camera /></button>
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageSelect} />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-xl shadow-sm text-gray-500"><Icons.Image /></button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                </div>
                <button onClick={analyzeWithAI} disabled={!query && !selectedImage} className="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg disabled:opacity-50">Analyze</button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map(food => (
                <div key={food.id} onClick={() => setSelectedFood(food)} className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-green-50 transition-colors flex justify-between items-center">
                  <div className="font-bold">{food.name}</div>
                  <Icons.Plus />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <h4 className="text-xl font-bold">{selectedFood.name}</h4>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(10, quantity - 10))} className="w-12 h-12 rounded-full bg-gray-100 text-2xl font-bold">-</button>
              <div className="flex-1 text-center"><div className="text-3xl font-black text-primary">{quantity}g</div></div>
              <button onClick={() => setQuantity(quantity + 10)} className="w-12 h-12 rounded-full bg-gray-100 text-2xl font-bold">+</button>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setSelectedFood(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold">Back</button>
              <button onClick={handleLocalAdd} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold">Add Meal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
