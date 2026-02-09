
import { UserProfile, ActivityLevel, Goal, NutritionTargets } from '../types';

/**
 * pure business logic for calculating nutrition targets.
 * Extracted from Onboarding.tsx to allow reuse and testing.
 */
export const calculateTargets = (
  weightKg: number, 
  heightCm: number, 
  age: number, 
  gender: UserProfile['gender'], 
  activityLevel: ActivityLevel, 
  goal: Goal
): { targets: NutritionTargets; explanation: string } => {
  
  // Mifflin-St Jeor Equation
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (gender === 'Male') bmr += 5;
  else bmr -= 161;

  const activityMultipliers: Record<ActivityLevel, number> = {
    'Sedentary': 1.2,
    'Light': 1.375,
    'Moderate': 1.55,
    'Active': 1.725,
    'Very Active': 1.9
  };

  let tdee = bmr * activityMultipliers[activityLevel];
  
  // Goal Adjustment
  if (goal === 'Lose Weight') tdee -= 500;
  else if (goal === 'Gain Muscle') tdee += 300; 

  const calories = Math.max(1200, Math.round(tdee)); // Safety floor
  const protein = Math.round((calories * 0.3) / 4);
  const carbs = Math.round((calories * 0.35) / 4);
  const fat = Math.round((calories * 0.35) / 9);
  
  return {
    targets: {
      calories,
      protein,
      carbs,
      fat,
      fiber: 30,
      micros: [
        { name: "Iron", amount: "18mg" },
        { name: "Calcium", amount: "1000mg" },
        { name: "Vitamin D", amount: "600IU" }
      ]
    },
    explanation: `Calculated based on BMR (${Math.round(bmr)}) and TDEE (${Math.round(tdee)}). Adjusted for ${goal}.`
  };
};
