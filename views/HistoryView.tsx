
import { useUser } from '../contexts/UserContext';
import { Meal, MealItem } from '../types';
import { formatTime } from '../utils/dateUtils';

export const HistoryView = ({ onMealClick }: { onMealClick: (meal: Meal) => void }) => {
  const { dailyLog } = useUser();

  if (!dailyLog) return null;

  return (
    <div className="animate-in fade-in duration-500 pb-24 md:pb-0">
     <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-6 sm:mb-8 px-1">History</h2>
     <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Today's Log</h3>
        {dailyLog.meals.length === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">No history for today.</p>
        ) : (
            <div className="space-y-5 sm:space-y-6">
                {dailyLog.meals.map((meal: Meal) => (
                    <div 
                        key={meal.id} 
                        onClick={() => onMealClick(meal)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View ${meal.mealType} details`}
                        className="border-b border-gray-50 pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 transition-colors p-3 -mx-3 rounded-xl"
                    >
                        <div className="flex justify-between mb-2">
                             <span className="font-bold text-gray-800 text-sm sm:text-base">{meal.mealType}</span>
                             <span className="text-gray-400 text-xs">{formatTime(meal.timestamp)}</span>
                        </div>
                        {meal.items.map((item: MealItem, idx: number) => (
                             <div key={idx} className="flex justify-between text-xs sm:text-sm text-gray-600 pl-2 border-l-2 border-gray-100 my-2">
                                 <span>{item.portionLabel}</span>
                                 <span>{item.nutrients.calories} kcal</span>
                             </div>
                        ))}
                        <div className="text-right font-black text-primary text-xs sm:text-sm mt-2">
                            Total: {meal.totalNutrients.calories} kcal
                        </div>
                    </div>
                ))}
            </div>
        )}
     </div>
  </div>
  );
};
