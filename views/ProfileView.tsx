
import React, { useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { exportUserData, importUserData } from '../services/db';
import { Icons } from '../components/Icons';

export const ProfileView = () => {
  const { userProfile } = useUser();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!userProfile) return null;

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
      showToast("Backup downloaded", "success");
    } catch (e) {
      showToast("Export failed", "error");
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
        showToast("Data imported successfully! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showToast("Import failed. Invalid file.", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4 sm:space-y-6 pb-24 md:pb-0">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight px-1">Profile</h2>
        
        <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-gray-400">
                {userProfile.name.charAt(0)}
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{userProfile.name}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Goal: {userProfile.goal}</p>
            </div>
        </div>

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
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
             <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50">
                 <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase mb-1">Weight</div>
                 <div className="text-xl sm:text-2xl font-black text-gray-900">{userProfile.weightKg} kg</div>
             </div>
             <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50">
                 <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase mb-1">Height</div>
                 <div className="text-xl sm:text-2xl font-black text-gray-900">{userProfile.heightCm} cm</div>
             </div>
        </div>

        {userProfile.targets && (
            <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50">
                <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base">Your Daily Plan</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div>
                        <div className="text-[9px] sm:text-xs text-gray-400 uppercase">Protein</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{userProfile.targets.protein}g</div>
                    </div>
                    <div>
                        <div className="text-[9px] sm:text-xs text-gray-400 uppercase">Carbs</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{userProfile.targets.carbs}g</div>
                    </div>
                    <div>
                         <div className="text-[9px] sm:text-xs text-gray-400 uppercase">Fat</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{userProfile.targets.fat}g</div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
