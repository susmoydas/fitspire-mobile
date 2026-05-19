export interface MealTemplate {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export const mealTemplates: MealTemplate[] = [
  { id: 'm1', name: 'Oatmeal with Berries', calories: 350, protein: 12, carbs: 58, fat: 8, mealType: 'breakfast' },
  { id: 'm2', name: 'Scrambled Eggs on Toast', calories: 400, protein: 25, carbs: 30, fat: 18, mealType: 'breakfast' },
  { id: 'm3', name: 'Protein Smoothie', calories: 300, protein: 30, carbs: 35, fat: 5, mealType: 'breakfast' },
  { id: 'm4', name: 'Greek Yogurt & Granola', calories: 280, protein: 20, carbs: 40, fat: 6, mealType: 'breakfast' },
  { id: 'm5', name: 'Chicken Salad Wrap', calories: 450, protein: 35, carbs: 35, fat: 16, mealType: 'lunch' },
  { id: 'm6', name: 'Turkey Sandwich', calories: 420, protein: 30, carbs: 40, fat: 14, mealType: 'lunch' },
  { id: 'm7', name: 'Quinoa Bowl', calories: 500, protein: 22, carbs: 65, fat: 18, mealType: 'lunch' },
  { id: 'm8', name: 'Grilled Chicken & Rice', calories: 550, protein: 45, carbs: 60, fat: 12, mealType: 'lunch' },
  { id: 'm9', name: 'Salmon with Vegetables', calories: 480, protein: 40, carbs: 20, fat: 22, mealType: 'dinner' },
  { id: 'm10', name: 'Lean Steak & Sweet Potato', calories: 520, protein: 42, carbs: 45, fat: 18, mealType: 'dinner' },
  { id: 'm11', name: 'Pasta with Chicken', calories: 600, protein: 35, carbs: 70, fat: 16, mealType: 'dinner' },
  { id: 'm12', name: 'Stir-fried Tofu & Veggies', calories: 380, protein: 25, carbs: 30, fat: 16, mealType: 'dinner' },
  { id: 'm13', name: 'Mixed Nuts', calories: 170, protein: 6, carbs: 8, fat: 15, mealType: 'snack' },
  { id: 'm14', name: 'Protein Bar', calories: 220, protein: 20, carbs: 25, fat: 8, mealType: 'snack' },
  { id: 'm15', name: 'Apple with Peanut Butter', calories: 250, protein: 8, carbs: 30, fat: 12, mealType: 'snack' },
  { id: 'm16', name: 'Cottage Cheese & Fruit', calories: 200, protein: 22, carbs: 18, fat: 5, mealType: 'snack' },
];
