
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
  sourceDatabase: "IFCT" | "USDA" | "Custom" | "AI"; // CRITICAL: Traceability
}

export interface PortionPreset {
  id: string;
  label: string;           // "1 roti", "1 katori", "1 cup"
  grams: number;           // Equivalent weight
  unit: PortionUnit;
}

export interface FoodItem {
  id: string;                    // UUID or IFCT ID
  name: string;                  // "Roti (Whole Wheat)"
  nameAliases: string[];         // ["Chapati", "Phulka"]
  regionalNames?: Record<string, string>; // { hi: "रोटी" }
  category: FoodCategory;
  nutrientsPerGram: Omit<Nutrients, 'sourceDatabase'>;   // Base values per 1g
  defaultPortionGrams: number;   // e.g., 40g for 1 roti
  portions: PortionPreset[];     // Common serving sizes
  source: "IFCT" | "USDA" | "Custom";
  version: string;               // "2024.1"
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
  id: string; // 'current_user'
  name: string;
  apiKey: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietaryPreference: DietaryPreference;
  medicalConditions: string;
  additionalDetails?: string; // New field for free-text goals/notes
  createdAt: number;
  // AI Generated Plan Persistence
  targets: NutritionTargets; 
  planExplanation: string;
}

// ============ CHAT ============

export interface ChatMessage {
  id?: number; // Auto-increment for DB
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// ============ DETECTION & TRACKING ============

export interface BoundingBox {
  x: number;        // % of viewport width
  y: number;
  width: number;
  height: number;
}

export interface FoodGuess {
  foodId: string;              // Reference to FoodItem.id
  confidence: number;          // 0-1
  portionEstimate?: number;    // Auto-estimated grams
}

export interface Detection {
  id: string;                  // Stable ID from IoU tracking
  boundingBox: BoundingBox;
  foodGuesses: FoodGuess[];    // Top 3
  timestamp: number;
  frameStable: boolean;        // true if ID stable > 5 frames
}

// ============ USER LOGGING ============

export interface MealItem {
  id: string;
  foodId: string;
  portionGrams: number;
  portionLabel: string;        // "2 roti"
  nutrients: Nutrients;        // CALCULATED, NOT AI GENERATED
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
  date: string;                // YYYY-MM-DD
  meals: Meal[];
  totalNutrients: Nutrients;
  targets: NutritionTargets;
}
