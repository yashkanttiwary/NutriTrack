
// ============ CORE DOMAIN TYPES ============

export type FoodCategory = 
  | "Grains" | "Proteins" | "Vegetables" | "Fruits" 
  | "Dairy" | "Snacks" | "Beverages" | "Mixed";

export type PortionUnit = 
  | "pieces" | "katori" | "cup" | "tbsp" | "tsp" 
  | "bowl" | "grams" | "ml" | "medium" | "large";

export interface Nutrients {
  calories: number;     // kcal
  protein: number;      // grams
  carbs: number;        // grams
  fat: number;          // grams
  fiber: number;        // grams
  micros?: string[];    // e.g., ["Iron: 10% DV", "Calcium: 50mg"]
  sourceDatabase: "IFCT" | "USDA" | "Custom" | "AI"; 
}

export interface PortionPreset {
  id: string;
  label: string; 
  grams: number;
  unit: PortionUnit;
}

export interface FoodItem {
  id: string;
  name: string;
  nameAliases: string[];
  regionalNames?: Record<string, string>;
  category: FoodCategory;
  nutrientsPerGram: Omit<Nutrients, 'sourceDatabase'>;
  defaultPortionGrams: number;
  portions: PortionPreset[];
  source: "IFCT" | "USDA" | "Custom";
  version: string;
}

// ============ USER PROFILE ============

export type Gender = "Male" | "Female" | "Other";
export type ActivityLevel = "Sedentary" | "Light" | "Moderate" | "Active" | "Very Active";
export type Goal = "Lose Weight" | "Maintain" | "Gain Muscle";
export type DietaryPreference = "Vegetarian" | "Non-Vegetarian" | "Eggetarian" | "Vegan" | "Jain";

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros: { name: string; amount: string }[];
}

export interface UserProfile {
  id: string; 
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietaryPreference: DietaryPreference;
  medicalConditions: string;
  additionalDetails?: string;
  createdAt: number;
  targets: NutritionTargets; 
  planExplanation: string;
}

// ============ CHAT ============

export interface ChatMessage {
  id?: number; 
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// ============ USER LOGGING ============

export interface MealItem {
  id: string;
  foodId: string;
  portionGrams: number;
  portionLabel: string;
  nutrients: Nutrients;
  confidence: "high" | "medium" | "low";
  manuallyAdded: boolean;
}

export interface Meal {
  id: string;
  timestamp: Date;
  items: MealItem[];
  totalNutrients: Nutrients;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
}

export interface DailyLog {
  date: string;
  meals: Meal[];
  totalNutrients: Nutrients;
  targets: NutritionTargets;
}
