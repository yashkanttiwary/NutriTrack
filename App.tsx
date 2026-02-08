import React, { useState, useEffect } from 'react';
import { getTodayLog, updateDailyTargets, saveMeal } from './services/db';
import { APP_CONFIG } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DailyLog, MealItem, Meal, FoodItem } from './types';
import { CameraScanner } from './components/CameraScanner';
import { nutritionCalculator } from './services/NutritionCalculator';

// --- Premium Icons (Custom SVGs) ---
const Icons = {
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Pencil: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Flame: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
};

// --- Modals ---

const ManualEntryModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (item: MealItem) => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100); // grams

  useEffect(() => {
    if (query.trim().length > 1) {
      setResults(nutritionCalculator.searchFoods(query));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleAdd = () => {
    if (!selectedFood) return;
    const nutrients = nutritionCalculator.calculateNutrients(selectedFood.id, quantity);
    const item: MealItem = {
      id: Math.random().toString(36).substr(2, 9),
      foodId: selectedFood.id,
      portionGrams: quantity,
      portionLabel: `${quantity}g ${selectedFood.name}`,
      nutrients: nutrients,
      confidence: "high", // manual entry is accurate
      manuallyAdded: true
    };
    onAdd(item);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md md:rounded-[2.5rem] rounded-t-[2.5rem] p-8 shadow-2xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Add Food</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><Icons.X /></button>
        </div>

        {!selectedFood ? (
          <>
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Search food (e.g., Roti, Dal)..." 
                className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border border-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {results.length === 0 && query.length > 1 && (
                <div className="text-center text-gray-400 mt-8">No results found.</div>
              )}
              {results.map(food => (
                <div 
                  key={food.id} 
                  onClick={() => setSelectedFood(food)}
                  className="p-4 rounded-xl hover:bg-green-50 active:bg-green-100 cursor-pointer border border-transparent hover:border-green-100 transition-all"
                >
                  <div className="font-bold text-gray-800">{food.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{food.defaultPortionGrams}g serving • {food.nutrientsPerGram.calories * food.defaultPortionGrams} kcal</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-800 mb-1">{selectedFood.name}</h4>
              <p className="text-sm text-gray-500 mb-8">{selectedFood.category}</p>
              
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setQuantity(Math.max(10, quantity - 10))}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 active:bg-gray-200"
                >-</button>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-black text-primary">{quantity}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grams</div>
                </div>
                <button 
                  onClick={() => setQuantity(quantity + 10)}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 active:bg-gray-200"
                >+</button>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase">Calories</div>
                  <div className="text-xl font-black text-gray-800">
                    {Math.round(selectedFood.nutrientsPerGram.calories * quantity)}
                  </div>
                </div>
                 <div>
                  <div className="text-xs font-bold text-gray-400 uppercase">Protein</div>
                  <div className="text-xl font-black text-gray-800">
                    {(selectedFood.nutrientsPerGram.protein * quantity).toFixed(1)}g
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setSelectedFood(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600">Back</button>
              <button onClick={handleAdd} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100">Add Meal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CalorieEditor = ({ current, onSave, onClose }: { current: number, onSave: (v: number) => void, onClose: () => void }) => {
  const [val, setVal] = useState(current);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <Icons.X />
        </button>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Daily Goal</h3>
        <p className="text-gray-500 mb-8 text-sm">Adjust your calorie target based on your current fitness goals.</p>
        
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <input 
              type="number" 
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              className="text-5xl font-extrabold text-primary w-full text-center focus:outline-none bg-transparent"
            />
            <span className="text-lg font-bold text-gray-300 pt-4">kcal</span>
          </div>
          <input 
            type="range" 
            min="1200" 
            max="4000" 
            step="50"
            value={val}
            onChange={(e) => setVal(Number(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">
            <span>Min 1200</span>
            <span>Max 4000</span>
          </div>
        </div>

        <button 
          onClick={() => { onSave(val); onClose(); }}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-100 hover:bg-green-600 hover:shadow-xl active:scale-[0.98] transition-all"
        >
          Update Goal
        </button>
      </div>
    </div>
  );
};

const ResultSummary = ({ items, onConfirm, onCancel }: { items: MealItem[], onConfirm: () => void, onCancel: () => void }) => {
  const totalCalories = items.reduce((acc, item) => acc + item.nutrients.calories, 0);
  
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl animate-slide-up flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-extrabold text-gray-900">Meal Detected</h3>
          <div className="bg-green-100 text-primary px-3 py-1 rounded-lg text-sm font-bold">AI Identified</div>
        </div>

        <div className="space-y-4 max-h-[30vh] overflow-y-auto custom-scrollbar">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">
                   {/* Fallback emoji logic */}
                   {item.portionLabel.toLowerCase().includes('roti') ? '🥯' : 
                    item.portionLabel.toLowerCase().includes('rice') ? '🍚' : 
                    item.portionLabel.toLowerCase().includes('banana') ? '🍌' : '🍲'}
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{item.portionLabel}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.manuallyAdded ? 'Manual Entry' : 'Confidence High'}</div>
                </div>
              </div>
              <div className="font-black text-gray-900">{item.nutrients.calories} kcal</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
          <span className="font-bold text-gray-500">Total Calories</span>
          <span className="text-3xl font-black text-primary">{totalCalories} kcal</span>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-600 active:scale-95 transition-all"
          >
            Log Meal
          </button>
        </div>
      </div>
    </div>
  );
};

// --- View Components ---

const HomeView = ({ 
  log, 
  calPercent, 
  setEditingCalories, 
  setIsScanning, 
  setIsManualAdd 
}: { 
  log: DailyLog, 
  calPercent: number, 
  setEditingCalories: (b: boolean) => void,
  setIsScanning: (b: boolean) => void,
  setIsManualAdd: (b: boolean) => void
}) => (
  <div className="md:grid md:grid-cols-2 md:gap-12 animate-in fade-in duration-500">
    {/* Left Side: Stats */}
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Hello, Jay!</h2>
        <p className="text-gray-500 font-medium">Ready for your {log.targets.calories} kcal goal?</p>
      </div>

      {/* Nutrition Card */}
      <div 
        onClick={() => setEditingCalories(true)}
        className="group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
          <Icons.Flame />
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 group-hover:text-primary transition-colors">
              Today's Nutrition
              <span className="text-gray-300"><Icons.Pencil /></span>
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Database: {APP_CONFIG.dbVersion}</p>
          </div>
          <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl shadow-sm">
            <Icons.Flame />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calories</span>
              <div className="text-right">
                <span className="text-4xl font-black text-gray-900">{log.totalNutrients.calories}</span>
                <span className="text-lg font-bold text-gray-300 mx-2">/</span>
                <span className="text-lg font-bold text-primary">{log.targets.calories}</span>
              </div>
            </div>
            <div className="h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-primary to-green-300 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${calPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MacroStat label="Protein" val={log.totalNutrients.protein} target={log.targets.protein} color="bg-blue-50 text-blue-600" />
            <MacroStat label="Carbs" val={log.totalNutrients.carbs} target={log.targets.carbs} color="bg-yellow-50 text-yellow-600" />
            <MacroStat label="Fat" val={log.totalNutrients.fat} target={log.targets.fat} color="bg-purple-50 text-purple-600" />
          </div>
        </div>
      </div>
    </section>

    {/* Right Side: Actions & Logs */}
    <section className="mt-12 md:mt-0 space-y-8">
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setIsScanning(true)}
          className="flex flex-col items-center justify-center gap-4 bg-primary text-white p-8 rounded-[2.5rem] font-bold shadow-lg shadow-green-100 hover:shadow-xl hover:bg-green-600 active:scale-95 transition-all group"
        >
          <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
            <Icons.Camera />
          </div>
          <span className="text-sm tracking-wide">Scan Meal</span>
        </button>

        <button 
          onClick={() => setIsManualAdd(true)}
          className="flex flex-col items-center justify-center gap-4 bg-white text-gray-800 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary/20 active:scale-95 transition-all group"
        >
          <div className="p-4 bg-gray-50 text-primary rounded-2xl group-hover:scale-110 transition-transform">
            <Icons.Plus />
          </div>
          <span className="text-sm tracking-wide">Manual Add</span>
        </button>
      </div>

      {/* Recent Meals List */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Recent Meals</h3>
          <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">View All</button>
        </div>

        {log.meals.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-200">
              <Icons.Book />
            </div>
            <p className="text-gray-400 text-sm font-medium">No meals logged yet today.</p>
            <p className="text-gray-300 text-xs mt-1">Use the camera to track your first meal.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {log.meals.slice().reverse().map(meal => (
              <div key={meal.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-green-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">
                    {meal.mealType === 'Breakfast' ? '🍳' : meal.mealType === 'Lunch' ? '🍛' : '🥗'}
                  </div>
                  <div>
                    <span className="block font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{meal.mealType}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{meal.items.length} items</span>
                  </div>
                </div>
                <span className="font-black text-gray-900 text-sm">{meal.totalNutrients.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  </div>
);

const HistoryView = ({ log }: { log: DailyLog }) => (
  <div className="animate-in fade-in duration-500">
     <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">History</h2>
     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Today's Log</h3>
        {log.meals.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No history for today.</p>
        ) : (
            <div className="space-y-6">
                {log.meals.map(meal => (
                    <div key={meal.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between mb-2">
                             <span className="font-bold text-gray-800">{meal.mealType}</span>
                             <span className="text-gray-400 text-xs">{meal.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        {meal.items.map((item, idx) => (
                             <div key={idx} className="flex justify-between text-sm text-gray-600 pl-2 border-l-2 border-gray-100 my-2">
                                 <span>{item.portionLabel}</span>
                                 <span>{item.nutrients.calories} kcal</span>
                             </div>
                        ))}
                        <div className="text-right font-black text-primary text-sm mt-2">
                            Total: {meal.totalNutrients.calories} kcal
                        </div>
                    </div>
                ))}
            </div>
        )}
     </div>
  </div>
);

const ProfileView = () => (
    <div className="animate-in fade-in duration-500 space-y-6">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Profile</h2>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400">
                JD
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900">Jay Doe</h3>
                <p className="text-gray-500 text-sm">Free Account</p>
            </div>
        </div>

        <div className="bg-primary/10 p-8 rounded-[2.5rem] border border-primary/20">
             <h3 className="text-lg font-bold text-primary mb-2">Premium Features</h3>
             <p className="text-sm text-primary/80 mb-4">Upgrade to unlock advanced macronutrient analytics and unlimited meal history.</p>
             <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md">Upgrade to Pro</button>
        </div>
    </div>
);


// --- Main App ---

const App: React.FC = () => {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [editingCalories, setEditingCalories] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [detectedItems, setDetectedItems] = useState<MealItem[] | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'history' | 'profile'>('home');

  useEffect(() => {
    getTodayLog().then(setLog);
  }, [detectedItems]); // Refresh when items are logged

  const updateTarget = async (newVal: number) => {
    if (!log) return;
    const newTargets = { ...log.targets, calories: newVal };
    await updateDailyTargets(newTargets);
    setLog({ ...log, targets: newTargets });
  };

  const handleScanResult = (items: MealItem[]) => {
    setIsScanning(false);
    setDetectedItems(items);
  };

  const handleManualAdd = (item: MealItem) => {
    setIsManualAdd(false);
    setDetectedItems([item]); // Open summary for confirmation
  };

  const confirmMeal = async () => {
    if (!detectedItems || !log) return;
    
    // Determine meal type based on time
    const hour = new Date().getHours();
    let mealType: Meal['mealType'] = 'Snack';
    if (hour >= 5 && hour < 11) mealType = 'Breakfast';
    else if (hour >= 11 && hour < 16) mealType = 'Lunch';
    else if (hour >= 16 && hour < 22) mealType = 'Dinner';

    const meal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      items: detectedItems,
      totalNutrients: detectedItems.reduce((acc, item) => ({
        calories: acc.calories + item.nutrients.calories,
        protein: acc.protein + item.nutrients.protein,
        carbs: acc.carbs + item.nutrients.carbs,
        fat: acc.fat + item.nutrients.fat,
        fiber: acc.fiber + item.nutrients.fiber,
        sourceDatabase: "IFCT"
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sourceDatabase: "IFCT" as any }),
      mealType: mealType
    };

    await saveMeal(meal);
    setDetectedItems(null);
    const updatedLog = await getTodayLog();
    setLog(updatedLog);
  };

  if (!log) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const calPercent = Math.min(100, Math.round((log.totalNutrients.calories / log.targets.calories) * 100));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8F9FA] text-text selection:bg-primary/20">
        
        {editingCalories && (
          <CalorieEditor 
            current={log.targets.calories} 
            onSave={updateTarget} 
            onClose={() => setEditingCalories(false)} 
          />
        )}

        {isScanning && (
          <CameraScanner 
            onClose={() => setIsScanning(false)} 
            onResult={handleScanResult} 
          />
        )}

        {isManualAdd && (
          <ManualEntryModal 
            onClose={() => setIsManualAdd(false)}
            onAdd={handleManualAdd}
          />
        )}

        {detectedItems && (
          <ResultSummary 
            items={detectedItems} 
            onConfirm={confirmMeal} 
            onCancel={() => setDetectedItems(null)} 
          />
        )}

        {/* Desktop Container Wrapper */}
        <div className="mx-auto max-w-md md:max-w-5xl md:pt-10 md:pb-10 min-h-screen md:min-h-0 flex flex-col md:flex-row md:gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 bg-white md:rounded-[3rem] shadow-sm md:shadow-2xl md:border md:border-gray-100 flex flex-col relative overflow-hidden">
            
            {/* Header */}
            <header className="px-8 py-8 flex justify-between items-center border-b border-gray-50">
              <div>
                <h1 className="text-2xl font-extrabold text-primary tracking-tight">NutriTrack</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Indian Food Lens</p>
              </div>
              <button className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">JD</span>
              </button>
            </header>

            {/* Content */}
            <main className="flex-1 px-8 py-8 overflow-y-auto pb-32 md:pb-12">
               {currentView === 'home' && (
                  <HomeView 
                    log={log} 
                    calPercent={calPercent} 
                    setEditingCalories={setEditingCalories} 
                    setIsScanning={setIsScanning}
                    setIsManualAdd={setIsManualAdd}
                  />
               )}
               {currentView === 'history' && <HistoryView log={log} />}
               {currentView === 'profile' && <ProfileView />}
            </main>

            {/* Floating Navigation Bar */}
            <nav className="fixed md:absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-2 pb-8 md:pb-4 flex justify-around items-center z-50">
              <NavIcon 
                icon={<Icons.Home />} 
                label="Home" 
                active={currentView === 'home'} 
                onClick={() => setCurrentView('home')} 
              />
              <NavIcon 
                icon={<Icons.Book />} 
                label="History" 
                active={currentView === 'history'} 
                onClick={() => setCurrentView('history')} 
              />
              <NavIcon 
                icon={<Icons.User />} 
                label="Profile" 
                active={currentView === 'profile'} 
                onClick={() => setCurrentView('profile')} 
              />
            </nav>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// --- Helpers ---

const MacroStat = ({ label, val, target, color }: { label: string, val: number, target: number, color: string }) => (
  <div className={`p-3 rounded-2xl text-center flex flex-col items-center ${color.split(' ')[0]}`}>
    <span className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-60">{label}</span>
    <span className={`text-sm font-black ${color.split(' ')[1]}`}>{val}g</span>
    <div className="w-full h-1 bg-white/50 rounded-full mt-2 overflow-hidden">
      <div 
        className={`h-full ${color.split(' ')[1].replace('text', 'bg')} transition-all duration-1000`}
        style={{ width: `${Math.min(100, (val/target)*100)}%` }}
      ></div>
    </div>
  </div>
);

const NavIcon = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[70px] ${active ? 'text-primary bg-green-50 scale-105' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
  >
    <span className="mb-1">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;