import { FoodItem } from '../types';

export const nutritionDb: { version: string; lastUpdated: string; foods: FoodItem[] } = {
  "version": "2024.1",
  "lastUpdated": "2024-02-01",
  "foods": [
    {
      "id": "ifct_001",
      "name": "Roti (Whole Wheat)",
      "nameAliases": ["Chapati", "Phulka", "Wheat Bread", "Fulka"],
      "category": "Grains",
      "nutrientsPerGram": { "calories": 3.0, "protein": 0.10, "carbs": 0.60, "fat": 0.05, "fiber": 0.10 },
      "defaultPortionGrams": 40,
      "portions": [{ "id": "p_r1", "label": "1 piece", "grams": 40, "unit": "pieces" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_002",
      "name": "Dal (Moong, cooked)",
      "nameAliases": ["Moong Dal", "Yellow Lentil", "Green Gram Dal"],
      "category": "Proteins",
      "nutrientsPerGram": { "calories": 1.2, "protein": 0.08, "carbs": 0.16, "fat": 0.027, "fiber": 0.04 },
      "defaultPortionGrams": 150,
      "portions": [{ "id": "p_d1", "label": "1 katori", "grams": 150, "unit": "katori" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_003",
      "name": "White Rice (Cooked)",
      "nameAliases": ["Chawal", "Steamed Rice", "Basmati Rice"],
      "category": "Grains",
      "nutrientsPerGram": { "calories": 1.3, "protein": 0.027, "carbs": 0.28, "fat": 0.003, "fiber": 0.004 },
      "defaultPortionGrams": 150,
      "portions": [{ "id": "p_ric1", "label": "1 katori", "grams": 150, "unit": "katori" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_004",
      "name": "Paneer Curry",
      "nameAliases": ["Paneer Butter Masala", "Shahi Paneer", "Paneer Sabzi"],
      "category": "Mixed",
      "nutrientsPerGram": { "calories": 2.5, "protein": 0.12, "carbs": 0.08, "fat": 0.20, "fiber": 0.01 },
      "defaultPortionGrams": 200,
      "portions": [{ "id": "p_pan1", "label": "1 katori", "grams": 200, "unit": "katori" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_005",
      "name": "Banana",
      "nameAliases": ["Kela", "Fruit"],
      "category": "Fruits",
      "nutrientsPerGram": { "calories": 0.89, "protein": 0.011, "carbs": 0.228, "fat": 0.003, "fiber": 0.026 },
      "defaultPortionGrams": 118,
      "portions": [{ "id": "p_ban1", "label": "1 medium", "grams": 118, "unit": "medium" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_006",
      "name": "Idli",
      "nameAliases": ["Rice Cake", "Steamed Rice Cake"],
      "category": "Grains",
      "nutrientsPerGram": { "calories": 1.4, "protein": 0.06, "carbs": 0.28, "fat": 0.005, "fiber": 0.01 },
      "defaultPortionGrams": 60,
      "portions": [{ "id": "p_idl1", "label": "1 piece", "grams": 60, "unit": "pieces" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_007",
      "name": "Masala Dosa",
      "nameAliases": ["Dosa", "Potato Dosa"],
      "category": "Mixed",
      "nutrientsPerGram": { "calories": 2.1, "protein": 0.05, "carbs": 0.32, "fat": 0.08, "fiber": 0.02 },
      "defaultPortionGrams": 250,
      "portions": [{ "id": "p_dos1", "label": "1 medium", "grams": 250, "unit": "medium" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_008",
      "name": "Samosa",
      "nameAliases": ["Aloo Samosa"],
      "category": "Snacks",
      "nutrientsPerGram": { "calories": 2.6, "protein": 0.06, "carbs": 0.32, "fat": 0.14, "fiber": 0.02 },
      "defaultPortionGrams": 80,
      "portions": [{ "id": "p_sam1", "label": "1 piece", "grams": 80, "unit": "pieces" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_009",
      "name": "Chai (Milk Tea)",
      "nameAliases": ["Tea", "Masala Chai", "Milk Tea with Sugar"],
      "category": "Beverages",
      "nutrientsPerGram": { "calories": 0.7, "protein": 0.02, "carbs": 0.10, "fat": 0.02, "fiber": 0.0 },
      "defaultPortionGrams": 150,
      "portions": [{ "id": "p_chai1", "label": "1 cup", "grams": 150, "unit": "cup" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_010",
      "name": "Curd (Yogurt)",
      "nameAliases": ["Dahi", "Yoghurt"],
      "category": "Dairy",
      "nutrientsPerGram": { "calories": 0.6, "protein": 0.035, "carbs": 0.045, "fat": 0.03, "fiber": 0.0 },
      "defaultPortionGrams": 150,
      "portions": [{ "id": "p_curd1", "label": "1 katori", "grams": 150, "unit": "katori" }],
      "source": "IFCT",
      "version": "2024.1"
    },
    {
      "id": "ifct_011",
      "name": "Apple",
      "nameAliases": ["Seb", "Fruit"],
      "category": "Fruits",
      "nutrientsPerGram": { "calories": 0.52, "protein": 0.003, "carbs": 0.14, "fat": 0.002, "fiber": 0.024 },
      "defaultPortionGrams": 180,
      "portions": [{ "id": "p_app1", "label": "1 medium", "grams": 180, "unit": "medium" }],
      "source": "IFCT",
      "version": "2024.1"
    },
     {
      "id": "ifct_012",
      "name": "Omelette (2 eggs)",
      "nameAliases": ["Egg Omelet", "Anda"],
      "category": "Proteins",
      "nutrientsPerGram": { "calories": 1.5, "protein": 0.11, "carbs": 0.01, "fat": 0.11, "fiber": 0.0 },
      "defaultPortionGrams": 120,
      "portions": [{ "id": "p_ome1", "label": "1 serving", "grams": 120, "unit": "medium" }],
      "source": "IFCT",
      "version": "2024.1"
    }
  ]
};
