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
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}