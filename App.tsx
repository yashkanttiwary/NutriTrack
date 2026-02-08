import React, { useState, useEffect, useRef } from 'react';
import { getTodayLog, updateDailyTargets, saveMeal, getUserProfile, saveUserProfile, exportUserData, importUserData, deleteMeal } from './services/db';
import { APP_CONFIG } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DailyLog, MealItem, Meal, UserProfile, NutritionTargets } from './types';
import { CameraScanner } from './components/CameraScanner';
import { Onboarding } from './components/Onboarding';
import { AIGuidance } from './components/AIGuidance';
import { ManualEntryModal } from './components/ManualEntryModal';
import { ResultSummary } from './components/ResultSummary';
import { MacroEditor } from './components/MacroEditor';
import { MealDetailModal } from './components/MealDetailModal';
import { Icons } from './components/Icons';

// --- View Components ---

const HomeView = ({ 
  log, 
  userProfile,
  calPercent, 
  setEditingCalories, 
  setIsScanning, 
  setIsManualAdd,
  onMealClick
}: { 
  log: DailyLog, 
  userProfile: UserProfile,
  calPercent: number, 
  setEditingCalories: (b: boolean) => void,
  setIsScanning: (b: boolean) => void,
  setIsManualAdd: (b: boolean) => void,
  onMealClick: (meal: Meal) => void
}) => (
  <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-12 animate-in fade-in duration-500 pb-24 md:pb-0">
    {/* Left Side: Stats */}
    <section className="space-y-5 sm:space-y-8">
      <div className="px-1">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Hello, {userProfile.name.split(' ')[0]}!</h2>
        <p className="text-sm sm:text-base text-gray-500 font-medium">Ready for your {log.targets.calories} kcal goal?</p>
      </div>

      {/* Nutrition Card - Responsive Padding & Sizing */}
      <div 
        onClick={() => setEditingCalories(true)}
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
                <span className="text-3xl sm:text-4xl font-black text-gray-900">{log.totalNutrients.calories}</span>
                <span className="text-sm sm:text-lg font-bold text-gray-300 mx-2">/</span>
                <span className="text-sm sm:text-lg font-bold text-primary">{log.targets.calories}</span>
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
            <MacroStat label="Protein" val={log.totalNutrients.protein} target={log.targets.protein} color="bg-blue-50 text-blue-600" />
            <MacroStat label="Carbs" val={log.totalNutrients.carbs} target={log.targets.carbs} color="bg-yellow-50 text-yellow-600" />
            <MacroStat label="Fat" val={log.totalNutrients.fat} target={log.targets.fat} color="bg-purple-50 text-purple-600" />
          </div>
        </div>
      </div>
    </section>

    {/* Right Side: Actions & Logs */}
    <section className="space-y-5 sm:space-y-8">
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button 
          onClick={() => setIsScanning(true)}
          className="flex flex-col items-center justify-center gap-3 sm:gap-4 bg-primary text-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] font-bold shadow-lg shadow-green-100 hover:shadow-xl hover:bg-green-600 active:scale-95 transition-all group"
        >
          <div className="p-3 sm:p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
            <Icons.Camera />
          </div>
          <span className="text-xs sm:text-sm tracking-wide">Scan Meal</span>
        </button>

        <button 
          onClick={() => setIsManualAdd(true)}
          className="flex flex-col items-center justify-center gap-3 sm:gap-4 bg-white text-gray-800 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary/20 active:scale-95 transition-all group"
        >
          <div className="p-3 sm:p-4 bg-gray-50 text-primary rounded-2xl group-hover:scale-110 transition-transform">
            <Icons.Plus />
          </div>
          <span className="text-xs sm:text-sm tracking-wide">Manual Add</span>
        </button>
      </div>

      {/* Recent Meals List */}
      <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Recent Meals</h3>
          <button onClick={() => {}} className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest hover:underline">View Details</button>
        </div>

        {log.meals.length === 0 ? (
          <div className="py-8 sm:py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-200">
              <Icons.Book />
            </div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium">No meals logged yet today.</p>
            <p className="text-gray-300 text-[10px] sm:text-xs mt-1">Use the camera to track your first meal.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {log.meals.slice().reverse().map(meal => (
              <div 
                key={meal.id} 
                onClick={() => onMealClick(meal)}
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
);

const HistoryView = ({ log, onMealClick }: { log: DailyLog, onMealClick: (meal: Meal) => void }) => (
  <div className="animate-in fade-in duration-500 pb-24 md:pb-0">
     <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-6 sm:mb-8 px-1">History</h2>
     <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Today's Log</h3>
        {log.meals.length === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">No history for today.</p>
        ) : (
            <div className="space-y-5 sm:space-y-6">
                {log.meals.map(meal => (
                    <div 
                        key={meal.id} 
                        onClick={() => onMealClick(meal)}
                        className="border-b border-gray-50 pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 transition-colors p-3 -mx-3 rounded-xl"
                    >
                        <div className="flex justify-between mb-2">
                             <span className="font-bold text-gray-800 text-sm sm:text-base">{meal.mealType}</span>
                             <span className="text-gray-400 text-xs">{meal.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        {meal.items.map((item, idx) => (
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

const ProfileView = ({ profile, onUpdateProfile }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void }) => {
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDisconnect = () => {
    if (window.confirm("Disconnecting will disable AI features. Continue?")) {
      onUpdateProfile({ ...profile, apiKey: '' });
    }
  };

  const handleSaveKey = () => {
    if (!newKey.trim()) return;
    onUpdateProfile({ ...profile, apiKey: newKey.trim() });
    setIsEditingKey(false);
    setNewKey('');
  };

  const handleExport = async () => {
    try {
      const blob = await exportUserData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutritrack_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm("This will overwrite your current data. Are you sure?")) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        await importUserData(json);
        alert("Data imported successfully! Reloading...");
        window.location.reload();
      } catch (err) {
        alert("Import failed. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4 sm:space-y-6 pb-24 md:pb-0">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight px-1">Profile</h2>
        
        {/* Profile Header */}
        <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-gray-400">
                {profile.name.charAt(0)}
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{profile.name}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Goal: {profile.goal}</p>
            </div>
        </div>

        {/* Data Management Section (HIGH-002) */}
        <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50 shadow-sm">
           <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base">Data Management</h3>
           <div className="flex gap-4">
              <button 
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-gray-600 text-sm transition-colors"
              >
                <Icons.Download /> Backup Data
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-gray-600 text-sm transition-colors"
              >
                <Icons.Upload /> Restore Data
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImport} 
              />
           </div>
           <p className="text-xs text-gray-400 mt-2">
             Save your data regularly to prevent loss if browser cache is cleared.
           </p>
        </div>

        {/* API Key Management Section */}
        <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base flex items-center gap-2">
              AI Settings
            </h3>
            
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gemini API Key</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${profile.apiKey ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profile.apiKey ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              
              {profile.apiKey && !isEditingKey ? (
                <div className="flex gap-3 mt-3">
                   <div className="flex-1 p-3 bg-white rounded-xl border border-gray-200 text-gray-400 font-mono text-sm flex items-center">
                     •••• •••• •••• {profile.apiKey.slice(-4)}
                   </div>
                   <button 
                     onClick={handleDisconnect}
                     className="px-4 py-2 bg-white border border-red-100 text-red-500 font-bold rounded-xl text-xs sm:text-sm hover:bg-red-50 transition-colors"
                   >
                     Disconnect
                   </button>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                   <input 
                     type="text" 
                     value={newKey}
                     onChange={e => setNewKey(e.target.value)}
                     placeholder="Paste new API Key here..."
                     className="flex-1 p-3 bg-white rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                   />
                   <button 
                     onClick={handleSaveKey}
                     className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-green-100 active:scale-95 transition-all"
                   >
                     Connect
                   </button>
                </div>
              )}

               {profile.apiKey && !isEditingKey && (
                 <button 
                   onClick={() => setIsEditingKey(true)}
                   className="text-xs text-gray-400 underline mt-3 hover:text-primary transition-colors ml-1"
                 >
                   Change Key
                 </button>
               )}
               
               {!profile.apiKey && (
                 <p className="text-[10px] text-gray-400 mt-3 ml-1">
                    Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                 </p>
               )}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
             <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50">
                 <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase mb-1">Weight</div>
                 <div className="text-xl sm:text-2xl font-black text-gray-900">{profile.weightKg} kg</div>
             </div>
             <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50">
                 <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase mb-1">Height</div>
                 <div className="text-xl sm:text-2xl font-black text-gray-900">{profile.heightCm} cm</div>
             </div>
        </div>

        {profile.targets && (
            <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50">
                <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base">Your Daily Plan</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center mb-6">
                    <div>
                        <div className="text-[9px] sm:text-xs text-gray-400 uppercase">Protein</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{profile.targets.protein}g</div>
                    </div>
                    <div>
                        <div className="text-[9px] sm:text-xs text-gray-400 uppercase">Carbs</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{profile.targets.carbs}g</div>
                    </div>
                    <div>
                         <div className="text-[9px] sm:text-xs text-gray-400 uppercase">Fat</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{profile.targets.fat}g</div>
                    </div>
                </div>

                {/* Added Micros Section in Profile */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 border-t border-gray-100 pt-4">
                    <div className="text-center">
                        <div className="text-[9px] sm:text-xs text-green-500 uppercase font-bold">Fiber</div>
                        <div className="font-bold text-gray-800 text-sm sm:text-base">{profile.targets.fiber}g</div>
                    </div>
                    {profile.targets.micros && profile.targets.micros.map((m, idx) => (
                         <div key={idx} className="text-center">
                            <div className="text-[9px] sm:text-xs text-gray-400 uppercase truncate" title={m.name}>{m.name}</div>
                            <div className="font-bold text-gray-800 text-sm sm:text-base truncate">{m.amount}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};


// --- Main App ---

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [editingCalories, setEditingCalories] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [detectedItems, setDetectedItems] = useState<MealItem[] | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'history' | 'profile'>('home');
  const [isSubmittingMeal, setIsSubmittingMeal] = useState(false);
  
  // NEW STATE: For detailed view
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  useEffect(() => {
    // Initial Load
    async function loadData() {
      const profile = await getUserProfile();
      if (profile) setUserProfile(profile);
      const todayLog = await getTodayLog();
      
      setLog(todayLog);
      setLoading(false);
    }
    loadData();
  }, [detectedItems]); // Reload when items change (save/add)

  const handleOnboardingComplete = async (data: Omit<UserProfile, 'id'>) => {
    // 1. Save profile to DB
    const savedProfile = await saveUserProfile(data);
    setUserProfile(savedProfile);
    
    // 2. Update today's log with the new targets immediately
    await updateDailyTargets(savedProfile.targets);
    const updatedLog = await getTodayLog();
    setLog(updatedLog);
  };

  const updateTargets = async (newTargets: NutritionTargets) => {
    if (!log || !userProfile) return;
    
    // 1. Update Profile (Persistent change)
    const updatedProfile = { ...userProfile, targets: newTargets };
    // Remove ID before saving as saveUserProfile handles it
    const { id, ...profileData } = updatedProfile;
    await saveUserProfile(profileData);
    setUserProfile(updatedProfile);

    // 2. Update Daily Log (Immediate reflection)
    await updateDailyTargets(newTargets);
    setLog({ ...log, targets: newTargets });
  };
  
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    const { id, ...profileData } = updatedProfile;
    await saveUserProfile(profileData);
    setUserProfile(updatedProfile);
  };

  const handleScanResult = (items: MealItem[]) => {
    setIsScanning(false);
    setDetectedItems(items);
  };

  const handleManualAdd = (items: MealItem[]) => {
    setIsManualAdd(false);
    setDetectedItems(items); // Open summary for confirmation
  };

  const confirmMeal = async (mealType: Meal['mealType']) => {
    if (!detectedItems || !log) return;
    setIsSubmittingMeal(true);
    
    try {
        // Collect all micros for the daily aggregation (HIGH-002 FIX)
        const mealMicros: string[] = [];
        detectedItems.forEach(item => {
        if (item.nutrients.micros) {
            mealMicros.push(...item.nutrients.micros);
        }
        });

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
            sourceDatabase: "IFCT",
            micros: [] // We aggregate aggregation in db.ts updateDailyLog, but good to have here too for meal object validity
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sourceDatabase: "IFCT" as any, micros: [] }),
        mealType: mealType
        };
        
        // Explicitly set the collected micros on the meal total for the DB to pick up
        meal.totalNutrients.micros = Array.from(new Set(mealMicros));

        await saveMeal(meal);
        setDetectedItems(null);
        const updatedLog = await getTodayLog();
        setLog(updatedLog);
    } catch (error) {
        console.error("Failed to save meal", error);
        alert("Failed to save meal. Please try again.");
    } finally {
        setIsSubmittingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await deleteMeal(mealId);
      // Refresh the log after deletion
      const updatedLog = await getTodayLog();
      setLog(updatedLog);
      // Close modal if open
      setSelectedMeal(null);
    } catch (error) {
      console.error("Failed to delete meal", error);
      alert("Failed to delete meal.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Flow: If no user profile, show onboarding
  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Flow: Main App
  if (!log) return null; // Should be covered by loading state

  const calPercent = Math.min(100, Math.round((log.totalNutrients.calories / log.targets.calories) * 100));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8F9FA] text-text selection:bg-primary/20">
        
        {editingCalories && (
          <MacroEditor 
            current={log.targets} 
            onSave={updateTargets} 
            onClose={() => setEditingCalories(false)} 
          />
        )}

        {isScanning && (
          <CameraScanner 
            onClose={() => setIsScanning(false)} 
            onResult={handleScanResult}
            apiKey={userProfile.apiKey}
          />
        )}

        {isManualAdd && (
          <ManualEntryModal 
            onClose={() => setIsManualAdd(false)}
            onAdd={handleManualAdd}
            apiKey={userProfile.apiKey}
          />
        )}

        {detectedItems && (
          <ResultSummary 
            items={detectedItems} 
            onUpdate={setDetectedItems}
            onConfirm={confirmMeal} 
            onCancel={() => setDetectedItems(null)}
            isSubmitting={isSubmittingMeal}
          />
        )}

        {selectedMeal && (
          <MealDetailModal 
            meal={selectedMeal}
            onClose={() => setSelectedMeal(null)}
            onDelete={handleDeleteMeal}
          />
        )}

        {/* AI Guidance Floating Button */}
        <AIGuidance apiKey={userProfile.apiKey} userProfile={userProfile} dailyLog={log} />

        {/* Responsive Desktop/Mobile Container Wrapper */}
        <div className="mx-auto w-full md:max-w-6xl md:h-[95vh] md:my-auto flex flex-col md:flex-row md:gap-6 justify-center">
          
          {/* Main Content Area */}
          <div className="w-full h-full md:h-auto bg-white md:rounded-[3rem] shadow-none md:shadow-2xl md:border md:border-gray-100 flex flex-col relative overflow-hidden">
            
            {/* Header */}
            <header className="px-5 py-5 sm:px-8 sm:py-8 flex justify-between items-center border-b border-gray-50">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">NutriTrack</h1>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 sm:mt-1">Indian Food Lens</p>
              </div>
              <button 
                onClick={() => setCurrentView('profile')}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors group"
              >
                <span className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">{userProfile.name.charAt(0)}</span>
              </button>
            </header>

            {/* Content */}
            <main className="flex-1 px-5 py-5 sm:px-8 sm:py-8 overflow-y-auto custom-scrollbar">
               {currentView === 'home' && (
                  <HomeView 
                    log={log} 
                    userProfile={userProfile}
                    calPercent={calPercent} 
                    setEditingCalories={setEditingCalories} 
                    setIsScanning={setIsScanning}
                    setIsManualAdd={setIsManualAdd}
                    onMealClick={setSelectedMeal}
                  />
               )}
               {currentView === 'history' && (
                 <HistoryView 
                   log={log} 
                   onMealClick={setSelectedMeal}
                 />
               )}
               {currentView === 'profile' && <ProfileView profile={userProfile} onUpdateProfile={handleUpdateProfile} />}
            </main>

            {/* Floating Navigation Bar */}
            <nav className="fixed md:absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-2 pb-6 md:pb-4 flex justify-around items-center z-50">
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
  <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center flex flex-col items-center justify-between h-full ${color.split(' ')[0]}`}>
    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60 truncate w-full">{label}</span>
    <span className={`text-xs sm:text-sm font-black truncate w-full ${color.split(' ')[1]}`}>{val}/{target}g</span>
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
    className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[60px] sm:min-w-[70px] ${active ? 'text-primary bg-green-50 scale-105' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
  >
    <span className="mb-1 scale-90 sm:scale-100">{icon}</span>
    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
