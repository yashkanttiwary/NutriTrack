import Dexie, { Table } from 'dexie';
import { Meal, DailyLog, Nutrients } from '../types';

class NutritionDatabase extends Dexie {
  meals!: Table<Meal>;
  dailyLogs!: Table<DailyLog>;

  constructor() {
    super('NutriTrackDB');
    
    // Define schema
    this.version(1).stores({
      meals: 'id, timestamp, mealType', // Primary key and indexed props
      dailyLogs: 'date'
    });
  }
}

export const db = new NutritionDatabase();

// Helper to save a meal
export async function saveMeal(meal: Meal) {
  return await db.transaction('rw', db.meals, db.dailyLogs, async () => {
    await db.meals.add(meal);
    await updateDailyLog(meal.timestamp);
  });
}

// Helper to delete a meal
export async function deleteMeal(id: string) {
  return await db.transaction('rw', db.meals, db.dailyLogs, async () => {
    const meal = await db.meals.get(id);
    if (!meal) return;
    
    await db.meals.delete(id);
    await updateDailyLog(meal.timestamp);
  });
}

// Re-calculates daily log from scratch to prevent rounding drift (Fixing MED-002)
async function updateDailyLog(date: Date) {
  const dateStr = date.toISOString().split('T')[0];
  
  // Find all meals for this day
  const dayStart = new Date(dateStr);
  dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23,59,59,999);
  
  const meals = await db.meals
    .where('timestamp')
    .between(dayStart, dayEnd)
    .toArray();
    
  if (meals.length === 0) {
    // If no meals left, possibly remove log or set to zero
    // For now we keep the log but empty
    await db.dailyLogs.put({
      date: dateStr,
      meals: [],
      totalNutrients: createZeroNutrients(),
      targets: {
        calories: 2000,
        protein: 80,
        carbs: 250,
        fat: 60,
        fiber: 30
      }
    });
    return;
  }
  
  // Recalculate totals from scratch
  const totalNutrients = meals.reduce((acc, meal) => {
    return sumNutrients(acc, meal.totalNutrients);
  }, createZeroNutrients());
  
  await db.dailyLogs.put({
    date: dateStr,
    meals: meals,
    totalNutrients: totalNutrients,
    targets: {
      calories: 2000,
      protein: 80,
      carbs: 250,
      fat: 60,
      fiber: 30
    }
  });
}

function createZeroNutrients(): Nutrients {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sourceDatabase: "Custom"
  };
}

function sumNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    calories: Math.round(a.calories + b.calories),
    // Fix floating point precision issues (e.g. 0.1 + 0.2 = 0.300000004)
    protein: parseFloat((a.protein + b.protein).toFixed(1)),
    carbs: parseFloat((a.carbs + b.carbs).toFixed(1)),
    fat: parseFloat((a.fat + b.fat).toFixed(1)),
    fiber: parseFloat((a.fiber + b.fiber).toFixed(1)),
    sourceDatabase: a.sourceDatabase
  };
}