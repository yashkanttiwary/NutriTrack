
import { Dexie, type Table } from 'dexie';
import { Meal, DailyLog, Nutrients } from '../types';

// Define the database class extending Dexie to leverage built-in methods
class NutritionDatabase extends Dexie {
  meals!: Table<Meal>;
  dailyLogs!: Table<DailyLog>;

  constructor() {
    super('NutriTrackDB');
    
    // Define schema: this.version and this.stores are inherited from Dexie
    // Fix: Explicitly cast to any to resolve "Property 'version' does not exist" compilation error
    (this as any).version(1).stores({
      meals: 'id, timestamp, mealType', // Primary key and indexed props
      dailyLogs: 'date'
    });
  }
}

// Create a single instance of the database
export const db = new NutritionDatabase();

// Helper to save a meal with transaction support for atomicity
export async function saveMeal(meal: Meal) {
  // Use the transaction method from the Dexie instance
  // Fix: Explicitly cast to any to resolve "Property 'transaction' does not exist" compilation error
  return await (db as any).transaction('rw', [db.meals, db.dailyLogs], async () => {
    await db.meals.add(meal);
    await updateDailyLog(meal.timestamp);
  });
}

// Helper to delete a meal and update the daily log
export async function deleteMeal(id: string) {
  // Use the transaction method from the Dexie instance
  // Fix: Explicitly cast to any to resolve "Property 'transaction' does not exist" compilation error
  return await (db as any).transaction('rw', [db.meals, db.dailyLogs], async () => {
    const meal = await db.meals.get(id);
    if (!meal) return;
    
    await db.meals.delete(id);
    await updateDailyLog(meal.timestamp);
  });
}

// Fetch today's log or return a default empty structure
export async function getTodayLog(): Promise<DailyLog> {
  const dateStr = new Date().toISOString().split('T')[0];
  const log = await db.dailyLogs.get(dateStr);
  
  if (log) return log;

  // Return default if not exists (don't save yet to avoid empty DB writes until action)
  return {
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
  };
}

// Update targets for specific date
export async function updateDailyTargets(targets: DailyLog['targets']) {
  const dateStr = new Date().toISOString().split('T')[0];
  
  // Use the transaction method from the Dexie instance
  // Fix: Explicitly cast to any to resolve "Property 'transaction' does not exist" compilation error
  await (db as any).transaction('rw', [db.dailyLogs], async () => {
    const log = await db.dailyLogs.get(dateStr);
    if (log) {
      await db.dailyLogs.update(dateStr, { targets });
    } else {
      // Create new log if updating targets before adding meals
      await db.dailyLogs.put({
        date: dateStr,
        meals: [],
        totalNutrients: createZeroNutrients(),
        targets
      });
    }
  });
}

// Re-calculates daily log from scratch to prevent rounding drift
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
    
  // Get existing targets to preserve them
  const existingLog = await db.dailyLogs.get(dateStr);
  const targets = existingLog?.targets || {
    calories: 2000,
    protein: 80,
    carbs: 250,
    fat: 60,
    fiber: 30
  };

  if (meals.length === 0) {
    await db.dailyLogs.put({
      date: dateStr,
      meals: [],
      totalNutrients: createZeroNutrients(),
      targets: targets
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
    targets: targets
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
