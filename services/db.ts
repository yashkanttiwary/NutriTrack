
import Dexie, { type Table } from 'dexie';
import { Meal, DailyLog, Nutrients, UserProfile, ChatMessage } from '../types';
import { getLocalISOString } from '../utils/dateUtils';
import { safeAdd } from '../utils/formatUtils';

class NutritionDatabase extends Dexie {
  meals!: Table<Meal>;
  dailyLogs!: Table<DailyLog>;
  userProfile!: Table<UserProfile>;
  chatMessages!: Table<ChatMessage>;
  apiCache!: Table<{ hash: string; response: string; timestamp: number }>;

  constructor() {
    super('NutriTrackDB');
    (this as any).version(5).stores({
      meals: 'id, timestamp, mealType', 
      dailyLogs: 'date',
      userProfile: 'id',
      chatMessages: '++id, timestamp',
      apiCache: 'hash, timestamp'
    });
  }
}

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
  await db.chatMessages.add({ role, text, timestamp: Date.now() });
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  return await db.chatMessages.orderBy('timestamp').toArray();
}

// --- Meal Helpers ---

export async function saveMeal(meal: Meal) {
  // Use ISO string for consistency
  const dateStr = getLocalISOString(meal.timestamp);
  
  return await (db as any).transaction('rw', [db.meals, db.dailyLogs], async () => {
    await db.meals.add(meal);
    
    // OPTIMIZATION (F-005): Incremental update instead of full recalculation
    const log = await db.dailyLogs.get(dateStr);
    
    if (log) {
      // Add new meal nutrients to existing total
      const newTotal = sumNutrients(log.totalNutrients, meal.totalNutrients);
      log.meals.push(meal);
      log.totalNutrients = newTotal;
      await db.dailyLogs.put(log);
    } else {
      // Create new log if not exists
      const profile = await db.userProfile.get('current_user');
      const targets = profile?.targets || createDefaultTargets();
      
      await db.dailyLogs.put({
        date: dateStr,
        meals: [meal],
        totalNutrients: meal.totalNutrients,
        targets: targets
      });
    }
  });
}

export async function deleteMeal(id: string) {
  return await (db as any).transaction('rw', [db.meals, db.dailyLogs], async () => {
    const meal = await db.meals.get(id);
    if (!meal) return;
    
    await db.meals.delete(id);
    
    // Recalculate is safer for delete to handle potential edge cases or just subtract
    // We will do a full recalc here to be safe as deletes are rare
    await recalculateDailyLog(meal.timestamp);
  });
}

export async function getTodayLog(): Promise<DailyLog> {
  const dateStr = getLocalISOString();
  const log = await db.dailyLogs.get(dateStr);
  
  if (log) return log;

  const profile = await getUserProfile();
  const targets = profile?.targets || createDefaultTargets();

  return {
    date: dateStr,
    meals: [],
    totalNutrients: createZeroNutrients(),
    targets: targets
  };
}

export async function updateDailyTargets(targets: DailyLog['targets']) {
  const dateStr = getLocalISOString();
  await (db as any).transaction('rw', [db.dailyLogs], async () => {
    const log = await db.dailyLogs.get(dateStr);
    if (log) {
      await db.dailyLogs.update(dateStr, { targets });
    } else {
      await db.dailyLogs.put({
        date: dateStr,
        meals: [],
        totalNutrients: createZeroNutrients(),
        targets
      });
    }
  });
}

// Fallback full recalculation
async function recalculateDailyLog(date: Date) {
  const dateStr = getLocalISOString(date);
  
  const dayStart = new Date(date);
  dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23,59,59,999);
  
  const meals = await db.meals
    .where('timestamp')
    .between(dayStart, dayEnd)
    .toArray();
    
  const existingLog = await db.dailyLogs.get(dateStr);
  const profile = await getUserProfile();
  const targets = existingLog?.targets || profile?.targets || createDefaultTargets();

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

function createDefaultTargets() {
  return {
    calories: 2000,
    protein: 80,
    carbs: 250,
    fat: 60,
    fiber: 30,
    micros: []
  };
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
  const combinedMicros = [...(a.micros || []), ...(b.micros || [])];
  const uniqueMicros = Array.from(new Set(combinedMicros));

  return {
    calories: Math.round(a.calories + b.calories),
    protein: safeAdd(a.protein, b.protein),
    carbs: safeAdd(a.carbs, b.carbs),
    fat: safeAdd(a.fat, b.fat),
    fiber: safeAdd(a.fiber, b.fiber),
    sourceDatabase: a.sourceDatabase,
    micros: uniqueMicros
  };
}

// --- Import/Export Helpers ---

export async function exportUserData(): Promise<Blob> {
  const profile = await db.userProfile.toArray();
  const logs = await db.dailyLogs.toArray();
  const meals = await db.meals.toArray();
  const chat = await db.chatMessages.toArray();
  
  // SECURITY: Remove API keys from export
  const safeProfile = profile.map(p => {
    const { apiKey, ...rest } = p;
    return rest;
  });

  const data = JSON.stringify({
    version: 1,
    timestamp: Date.now(),
    data: { profile: safeProfile, logs, meals, chat }
  }, null, 2);
  
  return new Blob([data], { type: 'application/json' });
}

export async function importUserData(jsonString: string): Promise<boolean> {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup.data) throw new Error("Invalid backup format");
    
    // SECURITY: Don't import API keys if they somehow exist in the backup (unlikely with our export, but good defense)
    if (backup.data.profile) {
      backup.data.profile = backup.data.profile.map((p: any) => {
        const { apiKey, ...rest } = p;
        return rest;
      });
    }

    await (db as any).transaction('rw', [db.userProfile, db.dailyLogs, db.meals, db.chatMessages], async () => {
      // Preserve existing API key if it exists
      const existingProfile = await db.userProfile.get('current_user');
      const existingKey = existingProfile?.apiKey;

      await db.userProfile.clear();
      await db.dailyLogs.clear();
      await db.meals.clear();
      await db.chatMessages.clear();
      
      if (backup.data.profile?.length) {
        // Restore key to the imported profile if found
        const importedProfile = backup.data.profile[0];
        if (existingKey) importedProfile.apiKey = existingKey;
        await db.userProfile.put(importedProfile);
      }
      
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
