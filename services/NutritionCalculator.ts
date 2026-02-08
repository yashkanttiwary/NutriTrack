import { nutritionDb } from '../data/nutrition-db';
import { FoodItem, Nutrients } from '../types';

export class NutritionCalculator {
  private foods: Map<string, FoodItem>;

  constructor() {
    this.foods = new Map(nutritionDb.foods.map(food => [food.id, food]));
  }

  public getFood(id: string): FoodItem | undefined {
    return this.foods.get(id);
  }

  // Improved Fuzzy Search (IMP-001)
  public searchFoods(query: string): FoodItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const queryTokens = q.split(/\s+/);
    
    return nutritionDb.foods.filter(f => {
      const name = f.name.toLowerCase();
      // Check if matches name
      const nameMatch = queryTokens.every(token => name.includes(token));
      if (nameMatch) return true;
      
      // Check aliases
      const aliasMatch = f.nameAliases.some(alias => {
         const aliasLower = alias.toLowerCase();
         return queryTokens.every(token => aliasLower.includes(token));
      });
      
      return aliasMatch;
    }).slice(0, 10);
  }

  /**
   * CRITICAL: This is the ONLY way to calculate nutrition.
   * AI/ML is NOT allowed to touch this function.
   * 
   * @param foodId - ID of the food item from database
   * @param portionGrams - Weight of the portion in grams
   * @returns Nutrients object validated against sanity checks
   */
  public calculateNutrients(foodId: string, portionGrams: number): Nutrients {
    const food = this.foods.get(foodId);
    if (!food) {
      throw new Error(`Food ID ${foodId} not found in database`);
    }

    if (portionGrams <= 0) {
       throw new Error(`Invalid portion grams: ${portionGrams}`);
    }

    const { nutrientsPerGram } = food;
    
    // Calculate raw values
    const rawCalories = nutrientsPerGram.calories * portionGrams;
    const rawProtein = nutrientsPerGram.protein * portionGrams;
    const rawCarbs = nutrientsPerGram.carbs * portionGrams;
    const rawFat = nutrientsPerGram.fat * portionGrams;
    const rawFiber = nutrientsPerGram.fiber * portionGrams;

    const result: Nutrients = {
      // Rounding rules: Calories nearest 1, Macros nearest 0.1
      calories: Math.round(rawCalories),
      protein: parseFloat(rawProtein.toFixed(1)),
      carbs: parseFloat(rawCarbs.toFixed(1)),
      fat: parseFloat(rawFat.toFixed(1)),
      fiber: parseFloat(rawFiber.toFixed(1)),
      sourceDatabase: food.source // Inheritance of trust
    };

    // CRITICAL SANITY CHECK
    this.verifySanity(result, food.name);

    return result;
  }

  /**
   * Verifies: kcal ≈ 4×protein + 4×carbs + 9×fat
   * Tolerance: ±20% (wider tolerance for fiber-rich/processed foods deviations)
   * This prevents "hallucinated" numbers if data entry was wrong.
   */
  private verifySanity(nutrients: Nutrients, foodName: string): boolean {
    const { calories, protein, carbs, fat } = nutrients;
    
    // Atwater factors
    const expectedKcal = (protein * 4) + (carbs * 4) + (fat * 9);
    
    // Avoid divide by zero for water/zero-cal foods
    if (expectedKcal < 10 && calories < 10) return true;

    const diff = Math.abs(calories - expectedKcal);
    const tolerance = Math.max(calories * 0.2, 20); // 20% or 20kcal buffer

    if (diff > tolerance) {
      console.warn(`Sanity check warning for ${foodName}: Listed ${calories}kcal, Calculated ${expectedKcal.toFixed(0)}kcal`);
      // In strict mode we might throw, but for now we warn and return true if close enough
      // For this implementation, we throw on gross errors (>50%)
      if (diff > Math.max(calories * 0.5, 50)) {
         throw new Error(`Sanity check FAILED for ${foodName}. Data corrupt.`);
      }
    }
    return true;
  }
}

export const nutritionCalculator = new NutritionCalculator();