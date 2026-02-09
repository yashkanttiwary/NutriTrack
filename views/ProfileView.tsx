
import React, { useRef, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { exportUserData, importUserData, saveUserProfile } from '../services/db';
import { Icons } from '../components/Icons';

export const ProfileView = () => {
  const { userProfile, setUserProfile, refreshLog } = useUser();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState(userProfile?.apiKey || '');
  const [isEditingKey, setIsEditingKey] = useState(false);
  
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

  const saveApiKey = async () => {
    try {
      const updated = { ...userProfile, apiKey: apiKey.trim() };
      const { id, ...rest } = updated; // Destructure to match saveUserProfile type
      await saveUserProfile(rest);
      setUserProfile(updated);
      setIsEditingKey(false);
      showToast("API Key updated", "success");
    } catch (e) {
      showToast("Failed to save key", "error");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4 sm:space-y-6 pb-24 md:pb-0">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight px-1">Profile</h2>
        
        {/* Profile Header */}
        <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-gray-400">
                {userProfile.name.charAt(0)}
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{userProfile.name}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Goal: {userProfile.goal}</p>
            </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50 shadow-sm">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800 text-sm sm:text-base">AI Connection</h3>
             {!isEditingKey && (
               <button onClick={() => setIsEditingKey(true)} className="text-primary text-xs font-bold uppercase tracking-widest">
                 {userProfile.apiKey ? 'Change' : 'Connect'}
               </button>
             )}
           </div>
           
           {isEditingKey ? (
             <div className="space-y-3">
               <input 
                 type="password"
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
                 className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono"
                 placeholder="Paste Gemini API Key"
               />
               <div className="flex gap-2">
                 <button onClick={saveApiKey} className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-bold">Save</button>
                 <button onClick={() => setIsEditingKey(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-bold">Cancel</button>
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-2">
               <div className={`w-3 h-3 rounded-full ${userProfile.apiKey ? 'bg-green-500' : 'bg-red-500'}`} />
               <span className="text-sm text-gray-600 font-medium">
                 {userProfile.apiKey ? 'Connected to Gemini AI' : 'Not Connected'}
               </span>
             </div>
           )}
        </div>

        {/* Data Management Section */}
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
             Save your data regularly. API Keys are removed from backups for security.
           </p>
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
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center mb-6">
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

                <div className="grid grid-cols-2 gap-2 sm:gap-3 border-t border-gray-100 pt-4">
                    <div className="text-center">
                        <div className="text-[9px] sm:text-xs text-green-500 uppercase font-bold">Fiber</div>
                        <div className="font-bold text-gray-800 text-sm sm:text-base">{userProfile.targets.fiber}g</div>
                    </div>
                    {userProfile.targets.micros && userProfile.targets.micros.map((m, idx) => (
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
