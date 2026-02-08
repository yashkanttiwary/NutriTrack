import React from 'react';
import { Meal } from '../types';
import { Icons } from './Icons';

interface MealDetailModalProps {
  meal: Meal;
  onClose: () => void;
  onDelete: (mealId: string) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({ meal, onClose, onDelete }) => {
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this meal? This cannot be undone.")) {
      onDelete(meal.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg md:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-black text-gray-900">{meal.mealType}</h3>
            <p className="text-sm text-gray-500 font-medium">
              {meal.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {meal.timestamp.toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
            <Icons.X />
          </button>
        </div>

        {/* Total Stats */}
        <div className="bg-green-50 rounded-[1.5rem] p-6 mb-6 border border-green-100">
           <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Total Energy</span>
              <span className="text-3xl font-black text-primary">{meal.totalNutrients.calories} <span className="text-lg text-green-600/60">kcal</span></span>
           </div>
           <div className="grid grid-cols-3 gap-3">
              <MacroBox label="Protein" val={meal.totalNutrients.protein} color="blue" />
              <MacroBox label="Carbs" val={meal.totalNutrients.carbs} color="yellow" />
              <MacroBox label="Fat" val={meal.totalNutrients.fat} color="purple" />
           </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6">
          <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">Food Items</h4>
          {meal.items.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{item.portionLabel}</span>
                  <span className="font-black text-gray-700 text-sm">{item.nutrients.calories} kcal</span>
               </div>
               <div className="flex gap-3 text-xs text-gray-500">
                  <span><span className="font-bold text-blue-500">P</span> {item.nutrients.protein}g</span>
                  <span><span className="font-bold text-yellow-500">C</span> {item.nutrients.carbs}g</span>
                  <span><span className="font-bold text-purple-500">F</span> {item.nutrients.fat}g</span>
                  {item.nutrients.fiber > 0 && <span><span className="font-bold text-green-500">Fib</span> {item.nutrients.fiber}g</span>}
               </div>
            </div>
          ))}

          {/* Micros Section */}
          {meal.totalNutrients.micros && meal.totalNutrients.micros.length > 0 && (
            <div className="mt-4">
               <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">Micronutrients</h4>
               <div className="flex flex-wrap gap-2">
                 {meal.totalNutrients.micros.map((m, i) => (
                   <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                     {m}
                   </span>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <button 
          onClick={handleDelete}
          className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Trash /> Delete Meal
        </button>
      </div>
    </div>
  );
};

const MacroBox = ({ label, val, color }: { label: string, val: number, color: string }) => {
    const colorClasses: {[key: string]: string} = {
        blue: "bg-blue-100 text-blue-700",
        yellow: "bg-yellow-100 text-yellow-700",
        purple: "bg-purple-100 text-purple-700"
    };

    return (
        <div className={`p-3 rounded-xl text-center ${colorClasses[color]}`}>
            <div className="text-[9px] font-bold uppercase opacity-70 mb-1">{label}</div>
            <div className="text-lg font-black">{val}g</div>
        </div>
    );
};
