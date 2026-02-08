import Dexie, { type Table } from 'dexie';
import { Meal, DailyLog, Nutrients, UserProfile, ChatMessage } from '../types';

// Define the database class extending Dexie to leverage built-in methods
class NutritionDatabase extends Dexie {
  meals!: Table<Meal>;
  dailyLogs!: Table<DailyLog>;
  userProfile!: Table<UserProfile>;
  chatMessages!: Table<ChatMessage>;

  constructor() {
    super('NutriTrackDB');
    
    // Define schema
    // Version 4: Bumped to ensure chatMessages table is created if it failed in v3
    // We define previous versions to allow upgrade path if needed, but for this fix,
    // defining the latest state as a new version is sufficient to trigger schema update.
    this.version(4).stores({
      meals: 'id, timestamp, mealType', 
      dailyLogs: 'date',
      userProfile: 'id',
      chatMessages: '++id, timestamp' 
    });
  }
}

// Create a single instance of the database
export const db = new NutritionDatabase();

// --- User Profile Helpers ---

export async function getUserProfile(): Promise<UserProfile | undefined> {
  return await db.userProfile.get('current_user');
}

export async function saveUserProfile(profile: Omit<UserProfile, 'id'>) {
  const fullProfile: UserProfile = { ...profile, id: 'current_user' };
  await db.userProfile.put(fullProfile);
  return fullProfile;
}

// --- Chat Helpers ---

export async function saveChatMessage(role: 'user' | 'model', text: string) {
  await db.chatMessages.add({
    role,
    text,
    timestamp: Date.now()
  });
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  return await db.chatMessages.orderBy('timestamp').toArray();
}

// --- Meal Helpers ---

// Helper to save a meal with transaction support for atomicity
export async function saveMeal(meal: Meal) {
  // Use the transaction method from the Dexie instance
  return await db.transaction('rw', [db.meals, db.dailyLogs], async () => {
    await db.meals.add(meal);
    await updateDailyLog(meal.timestamp);
  });
}

// Helper to delete a meal and update the daily log
export async function deleteMeal(id: string) {
  // Use the transaction method from the Dexie instance
  return await db.transaction('rw', [db.meals, db.dailyLogs], async () => {
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

  // If no log exists for today, try to get targets from user profile
  const profile = await getUserProfile();
  
  const defaultTargets = profile?.targets || {
    calories: 2000,
    protein: 80,
    carbs: 250,
    fat: 60,
    fiber: 30,
    micros: []
  };

  // Return default if not exists (don't save yet to avoid empty DB writes until action)
  return {
    date: dateStr,
    meals: [],
    totalNutrients: createZeroNutrients(),
    targets: defaultTargets
  };
}

// Update targets for specific date
export async function updateDailyTargets(targets: DailyLog['targets']) {
  const dateStr = new Date().toISOString().split('T')[0];
  
  // Use the transaction method from the Dexie instance
  await db.transaction('rw', [db.dailyLogs], async () => {
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
  const profile = await getUserProfile();
  
  const targets = existingLog?.targets || profile?.targets || {
    calories: 2000,
    protein: 80,
    carbs: 250,
    fat: 60,
    fiber: 30,
    micros: []
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
