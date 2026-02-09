
import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { Icons } from '../components/Icons';
import { MacroDisplay } from '../components/ui/MacroDisplay';
import { APP_CONFIG } from '../constants';
import { MacroEditor } from '../components/MacroEditor';
import { CameraScanner } from '../components/CameraScanner';
import { ManualEntryModal } from '../components/ManualEntryModal';
import { ResultSummary } from '../components/ResultSummary';
import { saveMeal, updateDailyTargets } from '../services/db';
import { Meal, MealItem } from '../types';

export const HomeView = ({ onMealClick }: { onMealClick: (meal: Meal) => void }) => {
  const { dailyLog, userProfile, refreshLog, refreshProfile } = useUser();
  const { showToast } = useToast();
  
  const [editingCalories, setEditingCalories] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [detectedItems, setDetectedItems] = useState<MealItem[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!dailyLog || !userProfile) return null;

  const calPercent = Math.min(100, Math.round((dailyLog.totalNutrients.calories / dailyLog.targets.calories) * 100));

  const handleUpdateTargets = async (t: any) => {
    await updateDailyTargets(t);
    await refreshLog();
    await refreshProfile(); // Profile keeps a copy of targets
    showToast("Targets updated", "success");
  };

  const handleConfirmMeal = async (mealType: Meal['mealType']) => {
    if (!detectedItems) return;
    setIsSubmitting(true);
    try {
        const mealMicros: string[] = [];
        detectedItems.forEach(item => {
          if (item.nutrients.micros) mealMicros.push(...item.nutrients.micros);
        });

        const meal: Meal = {
          id: crypto.randomUUID(), // IDEMPOTENCY FIX (F-016)
          timestamp: new Date(),
          items: detectedItems,
          totalNutrients: {
            ...detectedItems.reduce((acc, item) => ({
                calories: acc.calories + item.nutrients.calories,
                protein: acc.protein + item.nutrients.protein,
                carbs: acc.carbs + item.nutrients.carbs,
                fat: acc.fat + item.nutrients.fat,
                fiber: acc.fiber + item.nutrients.fiber,
                sourceDatabase: "IFCT",
                micros: []
            }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sourceDatabase: "IFCT" as any, micros: [] }),
            micros: Array.from(new Set(mealMicros))
          },
          mealType: mealType
        };
        
        await saveMeal(meal);
        await refreshLog();
        setDetectedItems(null);
        showToast("Meal logged successfully", "success");
    } catch (e) {
        showToast("Failed to save meal", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-12 animate-in fade-in duration-500 pb-24 md:pb-0">
        {/* Left Side: Stats */}
        <section className="space-y-5 sm:space-y-8">
          <div className="px-1">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Hello, {userProfile.name.split(' ')[0]}!</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium">Ready for your {dailyLog.targets.calories} kcal goal?</p>
          </div>

          <div 
            onClick={() => setEditingCalories(true)}
            role="button"
            aria-label="Edit Nutrition Targets"
            className="group relative bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <Icons.Flame />
            </div>

            <div className="flex justify-between items-start mb-6 sm:mb-8">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 group-hover:text-primary transition-colors">
                  Today's Nutrition
                  <span className="text-gray-300"><Icons.Pencil /></span>
                </h3>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Database: {APP_CONFIG.dbVersion}</p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-50 text-orange-500 rounded-2xl shadow-sm">
                <Icons.Flame />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calories</span>
                  <div className="text-right">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900">{dailyLog.totalNutrients.calories}</span>
                    <span className="text-sm sm:text-lg font-bold text-gray-300 mx-2">/</span>
                    <span className="text-sm sm:text-lg font-bold text-primary">{dailyLog.targets.calories}</span>
                  </div>
                </div>
                <div className="h-3 sm:h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-green-300 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${calPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <MacroDisplay label="Protein" val={dailyLog.totalNutrients.protein} target={dailyLog.targets.protein} color="blue" />
                <MacroDisplay label="Carbs" val={dailyLog.totalNutrients.carbs} target={dailyLog.targets.carbs} color="yellow" />
                <MacroDisplay label="Fat" val={dailyLog.totalNutrients.fat} target={dailyLog.targets.fat} color="purple" />
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Actions & Logs */}
        <section className="space-y-5 sm:space-y-8">
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button 
              onClick={() => setIsScanning(true)}
              aria-label="Scan Meal with Camera"
              className="flex flex-col items-center justify-center gap-3 sm:gap-4 bg-primary text-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] font-bold shadow-lg shadow-green-100 hover:shadow-xl hover:bg-green-600 active:scale-95 transition-all group"
            >
              <div className="p-3 sm:p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Icons.Camera />
              </div>
              <span className="text-xs sm:text-sm tracking-wide">Scan Meal</span>
            </button>

            <button 
              onClick={() => setIsManualAdd(true)}
              aria-label="Add Meal Manually"
              className="flex flex-col items-center justify-center gap-3 sm:gap-4 bg-white text-gray-800 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary/20 active:scale-95 transition-all group"
            >
              <div className="p-3 sm:p-4 bg-gray-50 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                <Icons.Plus />
              </div>
              <span className="text-xs sm:text-sm tracking-wide">Manual Add</span>
            </button>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Recent Meals</h3>
              <button className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest hover:underline">View Details</button>
            </div>

            {dailyLog.meals.length === 0 ? (
              <div className="py-8 sm:py-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-200">
                  <Icons.Book />
                </div>
                <p className="text-gray-400 text-xs sm:text-sm font-medium">No meals logged yet today.</p>
                <p className="text-gray-300 text-[10px] sm:text-xs mt-1">Use the camera to track your first meal.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {dailyLog.meals.slice().reverse().map(meal => (
                  <div 
                    key={meal.id} 
                    onClick={() => onMealClick(meal)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${meal.mealType} details`}
                    className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 rounded-2xl hover:bg-green-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-base sm:text-lg">
                        {meal.mealType === 'Breakfast' ? '🍳' : meal.mealType === 'Lunch' ? '🍛' : '🥗'}
                      </div>
                      <div>
                        <span className="block font-bold text-gray-800 text-xs sm:text-sm group-hover:text-primary transition-colors">{meal.mealType}</span>
                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{meal.items.length} items</span>
                      </div>
                    </div>
                    <span className="font-black text-gray-900 text-xs sm:text-sm">{meal.totalNutrients.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {editingCalories && (
          <MacroEditor 
            current={dailyLog.targets} 
            onSave={handleUpdateTargets} 
            onClose={() => setEditingCalories(false)} 
          />
      )}

      {isScanning && (
          <CameraScanner 
            onClose={() => setIsScanning(false)} 
            onResult={(items) => { setIsScanning(false); setDetectedItems(items); }}
          />
      )}

      {isManualAdd && (
          <ManualEntryModal 
            onClose={() => setIsManualAdd(false)}
            onAdd={(items) => { setIsManualAdd(false); setDetectedItems(items); }}
          />
      )}

      {detectedItems && (
          <ResultSummary 
            items={detectedItems} 
            onUpdate={setDetectedItems}
            onConfirm={handleConfirmMeal} 
            onCancel={() => setDetectedItems(null)}
            isSubmitting={isSubmitting}
          />
      )}
    </>
  );
};
