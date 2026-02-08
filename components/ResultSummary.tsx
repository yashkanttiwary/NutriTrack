import React, { useState, useEffect } from 'react';
import { MealItem, Meal } from '../types';
import { Icons } from './Icons';

interface ResultSummaryProps {
  items: MealItem[];
  onUpdate: (items: MealItem[]) => void;
  onConfirm: (mealType: Meal['mealType']) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({ items, onUpdate, onConfirm, onCancel, isSubmitting }) => {
  const [mealType, setMealType] = useState<Meal['mealType']>('Snack');
  
  useEffect(() => {
    // Determine default meal type based on time
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setMealType('Breakfast');
    else if (hour >= 11 && hour < 16) setMealType('Lunch');
    else if (hour >= 16 && hour < 22) setMealType('Dinner');
    else setMealType('Snack');
  }, []);

  const totalCalories = items.reduce((sum, item) => sum + item.nutrients.calories, 0);

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    if (newItems.length === 0) {
      onCancel();
    } else {
      onUpdate(newItems);
    }
  };

  const handleConfirm = () => {
    onConfirm(mealType);
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg md:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Meal Summary</h3>
            <p className="text-sm text-gray-500 font-medium">{items.length} items detected</p>
          </div>
          <div className="text-right">
             <div className="text-2xl font-black text-primary">{Math.round(totalCalories)}</div>
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total kcal</div>
          </div>
        </div>

        {/* Meal Type Selector (Fixed UI) */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(type => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                mealType === type 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-green-100/50 scale-[1.02]' 
                  : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar mb-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <div className="font-bold text-gray-800">{item.portionLabel}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.nutrients.protein}p • {item.nutrients.carbs}c • {item.nutrients.fat}f
                  {item.nutrients.sourceDatabase === 'AI' && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold uppercase">AI Est.</span>}
                </div>
                {item.nutrients.micros && item.nutrients.micros.length > 0 && (
                   <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.nutrients.micros.slice(0, 2).map((m, i) => (
                         <span key={i} className="text-[9px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500">{m}</span>
                      ))}
                   </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                 <div className="font-black text-gray-900">{item.nutrients.calories}</div>
                 <button onClick={() => handleRemove(idx)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm">
                    <Icons.Trash />
                 </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={onCancel} disabled={isSubmitting} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold disabled:opacity-50">Discard</button>
          <button 
            onClick={handleConfirm} 
            disabled={isSubmitting}
            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none transition-all"
          >
            {isSubmitting ? (
              <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Saving...
              </>
            ) : (
              <>Confirm Meal <Icons.Check /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
