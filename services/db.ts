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
    (this as any).version(4).stores({
      meals: 'id, timestamp, mealType', 
      dailyLogs: 'date',
      userProfile: 'id',
      chatMessages: '++id, timestamp' 
    });
  }
}

// Create a single instance of the database
export const db = new NutritionDatabase();

// --- Date Helper (HIGH-001 Fix) ---
// Generates YYYY-MM-DD based on LOCAL time, not UTC
function getLocalDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  return await (db as any).transaction('rw', [db.meals, db.dailyLogs], async () => {
    await db.meals.add(meal);
    await updateDailyLog(meal.timestamp);
  });
}

// Helper to delete a meal and update the daily log
export async function deleteMeal(id: string) {
  // Use the transaction method from the Dexie instance
  return await (db as any).transaction('rw', [db.meals, db.dailyLogs], async () => {
    const meal = await db.meals.get(id);
    if (!meal) return;
    
    await db.meals.delete(id);
    await updateDailyLog(meal.timestamp);
  });
}

// Fetch today's log or return a default empty structure
export async function getTodayLog(): Promise<DailyLog> {
  const dateStr = getLocalDayKey(); // Fixed: Use local date
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
  const dateStr = getLocalDayKey(); // Fixed: Use local date
  
  // Use the transaction method from the Dexie instance
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
  const dateStr = getLocalDayKey(date); // Fixed: Use local date of the meal
  
  // Find all meals for this day
  // Construct local start/end times carefully
  const dayStart = new Date(date);
  dayStart.setHours(0,0,0,0);
  
  const dayEnd = new Date(date);
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
    sourceDatabase: "Custom",
    micros: []
  };
}

function sumNutrients(a: Nutrients, b: Nutrients): Nutrients {
  // Aggregate micros: combine arrays and deduplicate simple strings
  const combinedMicros = [...(a.micros || []), ...(b.micros || [])];
  const uniqueMicros = Array.from(new Set(combinedMicros));

  return {
    calories: Math.round(a.calories + b.calories),
    // Fix floating point precision issues (e.g. 0.1 + 0.2 = 0.300000004)
    protein: parseFloat((a.protein + b.protein).toFixed(1)),
    carbs: parseFloat((a.carbs + b.carbs).toFixed(1)),
    fat: parseFloat((a.fat + b.fat).toFixed(1)),
    fiber: parseFloat((a.fiber + b.fiber).toFixed(1)),
    sourceDatabase: a.sourceDatabase,
    micros: uniqueMicros
  };
}

// --- Import/Export Helpers (HIGH-002) ---

export async function exportUserData(): Promise<Blob> {
  const profile = await db.userProfile.toArray();
  const logs = await db.dailyLogs.toArray();
  const meals = await db.meals.toArray();
  const chat = await db.chatMessages.toArray();
  
  const data = JSON.stringify({
    version: 1,
    timestamp: Date.now(),
    data: { profile, logs, meals, chat }
  }, null, 2);
  
  return new Blob([data], { type: 'application/json' });
}

export async function importUserData(jsonString: string): Promise<boolean> {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup.data) throw new Error("Invalid backup format");
    
    // Clear existing data and import new data transactionally
    await (db as any).transaction('rw', [db.userProfile, db.dailyLogs, db.meals, db.chatMessages], async () => {
      await db.userProfile.clear();
      await db.dailyLogs.clear();
      await db.meals.clear();
      await db.chatMessages.clear();
      
      if (backup.data.profile?.length) await db.userProfile.bulkAdd(backup.data.profile);
      if (backup.data.logs?.length) await db.dailyLogs.bulkAdd(backup.data.logs);
      if (backup.data.meals?.length) await db.meals.bulkAdd(backup.data.meals);
      if (backup.data.chat?.length) await db.chatMessages.bulkAdd(backup.data.chat);
    });
    return true;
  } catch (e) {
    console.error("Import failed", e);
    throw e;
  }
}
