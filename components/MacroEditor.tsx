import React, { useState } from 'react';
import { NutritionTargets } from '../types';
import { Icons } from './Icons';

interface MacroEditorProps {
  current: NutritionTargets;
  onSave: (t: NutritionTargets) => void;
  onClose: () => void;
}

export const MacroEditor: React.FC<MacroEditorProps> = ({ current, onSave, onClose }) => {
  const [targets, setTargets] = useState(current);

  const handleChange = (field: keyof NutritionTargets, value: any) => {
    setTargets(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(targets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Edit Nutrition Goals</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><Icons.X /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Daily Calories</label>
            <input 
              type="number" 
              value={targets.calories}
              onChange={(e) => handleChange('calories', Number(e.target.value))}
              className="w-full p-4 bg-gray-50 rounded-2xl font-black text-2xl text-gray-900 border-2 border-transparent focus:border-primary/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
               <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Protein (g)</label>
               <input 
                  type="number" 
                  value={targets.protein}
                  onChange={(e) => handleChange('protein', Number(e.target.value))}
                  className="w-full p-3 bg-blue-50 rounded-xl font-bold text-blue-900 border-none outline-none text-center"
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Carbs (g)</label>
               <input 
                  type="number" 
                  value={targets.carbs}
                  onChange={(e) => handleChange('carbs', Number(e.target.value))}
                  className="w-full p-3 bg-yellow-50 rounded-xl font-bold text-yellow-900 border-none outline-none text-center"
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Fat (g)</label>
               <input 
                  type="number" 
                  value={targets.fat}
                  onChange={(e) => handleChange('fat', Number(e.target.value))}
                  className="w-full p-3 bg-purple-50 rounded-xl font-bold text-purple-900 border-none outline-none text-center"
               />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
