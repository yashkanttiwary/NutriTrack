
import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, Goal, DietaryPreference, NutritionTargets } from '../types';
import { calculateTargets } from '../services/userService';
import { Icons } from './Icons';

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, 'id'>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    gender: 'Male' as Gender,
    age: 25,
    heightCm: 170,
    weightKg: 70,
    activityLevel: 'Moderate' as ActivityLevel,
    goal: 'Maintain' as Goal,
    dietaryPreference: 'Vegetarian' as DietaryPreference,
    medicalConditions: '',
    additionalDetails: ''
  });

  const [planData, setPlanData] = useState<{
    targets: NutritionTargets;
    explanation: string;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const generatePlan = async () => {
    setIsGenerating(true);
    setTimeout(() => {
        const result = calculateTargets(
            data.weightKg, 
            data.heightCm, 
            data.age, 
            data.gender, 
            data.activityLevel, 
            data.goal
        );
        setPlanData(result);
        setIsGenerating(false);
        nextStep();
    }, 1500);
  };

  const handleFinish = () => {
    if (!planData) return;
    onComplete({
      ...data,
      targets: planData.targets,
      planExplanation: planData.explanation,
      createdAt: Date.now()
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-gray-100'}`} />
          ))}
        </div>

        <div className="animate-in fade-in duration-300">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to NutriTrack</h1>
                <p className="text-gray-500">Let's set up your personal nutrition assistant.</p>
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
              </div>

              <button 
                onClick={nextStep}
                disabled={!data.name}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 disabled:opacity-50"
              >
                Get Started
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
                    className="w-full p-4 bg-gray-50 rounded-2xl border-r-[16px] border-transparent font-bold text-gray-900 outline-none"
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
                <button onClick={nextStep} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100">Next</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Health & Personalization</h2>
              
              <div className="space-y-4">
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Dietary Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => handleChange('dietaryPreference', d)}
                        className={`p-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${data.dietaryPreference === d ? 'border-primary bg-green-50 text-primary' : 'border-gray-100 text-gray-400'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Medical Conditions (Optional)</label>
                  <textarea 
                    value={data.medicalConditions}
                    onChange={(e) => handleChange('medicalConditions', e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none font-medium text-gray-900 resize-none h-20"
                    placeholder="e.g. Diabetes, PCOD, Lactose Intolerant..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Detailed Goals (Optional)</label>
                  <textarea 
                    value={data.additionalDetails}
                    onChange={(e) => handleChange('additionalDetails', e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none font-medium text-gray-900 resize-none h-28"
                    placeholder="Tell us more about your specific goals..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Back</button>
                <button 
                  onClick={generatePlan} 
                  disabled={isGenerating}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Calculating...
                    </>
                  ) : (
                    "Create Plan"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 5 && planData && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 text-center">Your Personal Plan</h2>
              
              <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 text-center">
                 <p className="text-gray-500 font-medium mb-1">Daily Calorie Target</p>
                 <div className="text-5xl font-black text-primary">{planData.targets.calories}</div>
                 <div className="text-sm font-bold text-primary/60 uppercase tracking-widest mt-1">kcal / day</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-blue-50 p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-blue-400 uppercase">Protein</div>
                    <div className="text-xl font-black text-blue-600">{planData.targets.protein}g</div>
                 </div>
                 <div className="bg-yellow-50 p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-yellow-500 uppercase">Carbs</div>
                    <div className="text-xl font-black text-yellow-600">{planData.targets.carbs}g</div>
                 </div>
                 <div className="bg-purple-50 p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-purple-400 uppercase">Fat</div>
                    <div className="text-xl font-black text-purple-600">{planData.targets.fat}g</div>
                 </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {planData.explanation}
                </p>
              </div>

              <button 
                onClick={handleFinish}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-green-200"
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
