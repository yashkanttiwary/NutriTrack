import React, { useState, useEffect } from 'react';
import { getTodayLog, updateDailyTargets, saveMeal } from './services/db';
import { APP_CONFIG } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DailyLog, MealItem, Meal } from './types';
import { CameraScanner } from './components/CameraScanner';

// --- Premium Icons (Custom SVGs) ---
const Icons = {
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Pencil: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Flame: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

// --- Modals ---

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
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">🍱</div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{item.portionLabel}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Confidence High</div>
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

// --- Main App ---

const App: React.FC = () => {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [editingCalories, setEditingCalories] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedItems, setDetectedItems] = useState<MealItem[] | null>(null);

  useEffect(() => {
    getTodayLog().then(setLog);
  }, []);

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

  const confirmMeal = async () => {
    if (!detectedItems || !log) return;
    
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
      mealType: "Lunch" // Simplified for now
    };

    await saveMeal(meal);
    setDetectedItems(null);
    getTodayLog().then(setLog);
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
              
              <div className="md:grid md:grid-cols-2 md:gap-12">
                
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
                      onClick={() => {}}
                      className="flex flex-col items-center justify-center gap-4 bg-white text-gray-800 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary/20 active:scale-95 transition-all group opacity-50 cursor-not-allowed"
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
            </main>

            {/* Floating Navigation Bar */}
            <nav className="fixed md:absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-2 pb-8 md:pb-4 flex justify-around items-center z-50">
              <NavIcon icon={<Icons.Home />} label="Home" active />
              <NavIcon icon={<Icons.Book />} label="History" />
              <NavIcon icon={<Icons.User />} label="Profile" />
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

const NavIcon = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <button className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[70px] ${active ? 'text-primary bg-green-50 scale-105' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}>
    <span className="mb-1">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;