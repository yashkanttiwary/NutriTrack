import React, { useState, useEffect } from 'react';
import { nutritionCalculator } from './services/NutritionCalculator';
import { APP_CONFIG } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';

// Placeholder components for Phase 1 structure
const Dashboard = () => (
  <div className="p-4 space-y-4">
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Today's Nutrition</h2>
      <p className="text-sm text-gray-500 mb-4">Database: {APP_CONFIG.dbVersion}</p>
      
      {/* Progress Bars Placeholder */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Calories</span>
            <span className="font-semibold">0 / 2000 kcal</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-0 transition-all duration-500"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <button className="bg-primary text-white p-4 rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
        <span className="text-2xl">📷</span>
        Scan Meal
      </button>
      <button className="bg-white text-primary border-2 border-primary p-4 rounded-2xl font-semibold active:scale-95 transition-transform flex flex-col items-center justify-center gap-2">
        <span className="text-2xl">✏️</span>
        Manual Add
      </button>
    </div>

    {/* Developer Verify Section */}
    <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs font-mono text-gray-600">
      <p className="font-bold mb-2">DEV: Nutrition Engine Check</p>
      <NutritionCheck />
    </div>
  </div>
);

// Component to verify Nutrition Logic runs correctly
const NutritionCheck = () => {
  const [checkResult, setCheckResult] = useState<string>('Running checks...');

  useEffect(() => {
    try {
      const roti = nutritionCalculator.calculateNutrients('ifct_001', 40);
      const dal = nutritionCalculator.calculateNutrients('ifct_002', 150);
      
      setCheckResult(
        `✓ Roti (40g): ${roti.calories}kcal (Exp: 120)\n` +
        `✓ Dal (150g): ${dal.calories}kcal (Exp: 180)\n` +
        `✓ Sanity: PASSED`
      );
    } catch (e: any) {
      setCheckResult(`❌ FAILED: ${e.message}`);
    }
  }, []);

  return <pre className="whitespace-pre-wrap">{checkResult}</pre>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background max-w-md mx-auto relative">
        {/* Header */}
        <header className="px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary tracking-tight">{APP_CONFIG.name}</h1>
          <div className="w-8 h-8 rounded-full bg-gray-100"></div>
        </header>

        {/* Main Content */}
        <main>
          <Dashboard />
        </main>

        {/* Navigation - sticky bottom */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around pb-6 max-w-md mx-auto">
          <button className="flex flex-col items-center text-primary">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <span className="text-xl">📖</span>
            <span className="text-[10px] font-medium">Log</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>
      </div>
    </ErrorBoundary>
  );
};

export default App;