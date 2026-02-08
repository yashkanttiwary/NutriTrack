import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, Goal } from '../types';

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, 'id'>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    apiKey: '',
    gender: 'Male' as Gender,
    age: 25,
    heightCm: 170,
    weightKg: 70,
    activityLevel: 'Moderate' as ActivityLevel,
    goal: 'Maintain' as Goal
  });

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const calculateTargets = () => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * data.weightKg) + (6.25 * data.heightCm) - (5 * data.age);
    if (data.gender === 'Male') bmr += 5;
    else bmr -= 161;

    const activityMultipliers: Record<ActivityLevel, number> = {
      'Sedentary': 1.2,
      'Light': 1.375,
      'Moderate': 1.55,
      'Active': 1.725,
      'Very Active': 1.9
    };

    let tdee = bmr * activityMultipliers[data.activityLevel];
    
    // Goal Adjustment
    if (data.goal === 'Lose Weight') tdee -= 500;
    else if (data.goal === 'Gain Muscle') tdee += 300; // Conservative surplus

    const calories = Math.round(tdee);
    
    // Simple Macro Split (30P/35C/35F approx)
    const protein = Math.round((calories * 0.3) / 4);
    const carbs = Math.round((calories * 0.35) / 4);
    const fat = Math.round((calories * 0.35) / 9);
    const fiber = 30; // Generic goal

    return { calories, protein, carbs, fat, fiber };
  };

  const handleFinish = () => {
    onComplete({
      ...data,
      createdAt: Date.now()
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-gray-100'}`} />
          ))}
        </div>

        <div className="animate-in fade-in duration-300">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to NutriTrack</h1>
                <p className="text-gray-500">Let's set up your personal AI nutrition assistant.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">What should we call you?</label>
                  <input 
                    type="text" 
                    value={data.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none font-bold text-gray-900"
                    placeholder="Your Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={data.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none font-mono text-gray-900 text-sm"
                    placeholder="AIzaSy..."
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    We need this to power the AI features. Your key is stored locally on your device. 
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary hover:underline ml-1">Get a key here.</a>
                  </p>
                </div>
              </div>

              <button 
                onClick={nextStep}
                disabled={!data.name || !data.apiKey}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Body Stats</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                  <div className="flex gap-2">
                    {(['Male', 'Female', 'Other'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => handleChange('gender', g)}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${data.gender === g ? 'border-primary bg-green-50 text-primary' : 'border-gray-100 text-gray-400'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                    <input 
                      type="number" 
                      value={data.age}
                      onChange={(e) => handleChange('age', Number(e.target.value))}
                      className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 text-center"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={data.weightKg}
                      onChange={(e) => handleChange('weightKg', Number(e.target.value))}
                      className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 text-center"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Height (cm)</label>
                    <input 
                      type="range" 
                      min="100" max="250"
                      value={data.heightCm}
                      onChange={(e) => handleChange('heightCm', Number(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="text-center font-black text-2xl text-primary mt-2">{data.heightCm} cm</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Back</button>
                <button onClick={nextStep} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Goal & Lifestyle</h2>
              
              <div className="space-y-4">
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Activity Level</label>
                  <select 
                    value={data.activityLevel}
                    onChange={(e) => handleChange('activityLevel', e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-r-[16px] border-transparent font-bold text-gray-900"
                  >
                    <option value="Sedentary">Sedentary (Office job)</option>
                    <option value="Light">Light Exercise (1-2 days/week)</option>
                    <option value="Moderate">Moderate Exercise (3-5 days/week)</option>
                    <option value="Active">Active (6-7 days/week)</option>
                    <option value="Very Active">Very Active (Physical job)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Main Goal</label>
                  <div className="flex flex-col gap-2">
                    {(['Lose Weight', 'Maintain', 'Gain Muscle'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => handleChange('goal', g)}
                        className={`p-4 rounded-xl border-2 text-left font-bold transition-all ${data.goal === g ? 'border-primary bg-green-50 text-primary' : 'border-gray-100 text-gray-400'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Back</button>
                <button onClick={nextStep} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100">See Plan</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center">Your Personal Plan</h2>
              
              <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 text-center">
                 <p className="text-gray-500 font-medium mb-1">Daily Calorie Target</p>
                 <div className="text-5xl font-black text-primary">{calculateTargets().calories}</div>
                 <div className="text-sm font-bold text-primary/60 uppercase tracking-widest mt-1">kcal / day</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-blue-50 p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-blue-400 uppercase">Protein</div>
                    <div className="text-xl font-black text-blue-600">{calculateTargets().protein}g</div>
                 </div>
                 <div className="bg-yellow-50 p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-yellow-500 uppercase">Carbs</div>
                    <div className="text-xl font-black text-yellow-600">{calculateTargets().carbs}g</div>
                 </div>
                 <div className="bg-purple-50 p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-purple-400 uppercase">Fat</div>
                    <div className="text-xl font-black text-purple-600">{calculateTargets().fat}g</div>
                 </div>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
                These targets are calculated based on your BMR ({data.gender}) and activity level. You can adjust them later in settings.
              </p>

              <button 
                onClick={handleFinish}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-green-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Let's Start!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};