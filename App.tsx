
import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Onboarding } from './components/Onboarding';
import { AIGuidance } from './components/AIGuidance';
import { MealDetailModal } from './components/MealDetailModal';
import { Icons } from './components/Icons';
import { UserProvider, useUser } from './contexts/UserContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { HomeView } from './views/HomeView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import { Meal, UserProfile } from './types';
import { saveUserProfile, deleteMeal, updateDailyTargets } from './services/db';

const AppContent = () => {
  const { userProfile, setUserProfile, dailyLog, refreshLog, loading } = useUser();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<'home' | 'history' | 'profile'>('home');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleOnboardingComplete = async (data: Omit<UserProfile, 'id'>) => {
    const savedProfile = await saveUserProfile(data);
    setUserProfile(savedProfile);
    await updateDailyTargets(savedProfile.targets);
    await refreshLog();
    showToast("Profile created!", "success");
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await deleteMeal(mealId);
      await refreshLog();
      setSelectedMeal(null);
      showToast("Meal deleted", "info");
    } catch (error) {
      showToast("Failed to delete meal", "error");
    }
  };

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-text selection:bg-primary/20">
      <div className="mx-auto w-full md:max-w-6xl md:h-[95vh] md:my-auto flex flex-col md:flex-row md:gap-6 justify-center">
        
        <div className="w-full h-full md:h-auto bg-white md:rounded-[3rem] shadow-none md:shadow-2xl md:border md:border-gray-100 flex flex-col relative overflow-hidden">
          
          <header className="px-5 py-5 sm:px-8 sm:py-8 flex justify-between items-center border-b border-gray-50">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">NutriTrack</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 sm:mt-1">Indian Food Lens</p>
            </div>
            <button 
              onClick={() => setCurrentView('profile')}
              aria-label="Go to Profile"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors group"
            >
              <span className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">{userProfile.name.charAt(0)}</span>
            </button>
          </header>

          <main className="flex-1 px-5 py-5 sm:px-8 sm:py-8 overflow-y-auto custom-scrollbar">
            <ErrorBoundary>
              {currentView === 'home' && <HomeView onMealClick={setSelectedMeal} />}
              {currentView === 'history' && <HistoryView onMealClick={setSelectedMeal} />}
              {currentView === 'profile' && <ProfileView />}
            </ErrorBoundary>
          </main>

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

      {dailyLog && <AIGuidance userProfile={userProfile} dailyLog={dailyLog} />}

      {selectedMeal && (
        <MealDetailModal 
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onDelete={handleDeleteMeal}
        />
      )}
    </div>
  );
};

const NavIcon = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    aria-label={`Navigate to ${label}`}
    className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[60px] sm:min-w-[70px] ${active ? 'text-primary bg-green-50 scale-105' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
  >
    <span className="mb-1 scale-90 sm:scale-100">{icon}</span>
    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;
