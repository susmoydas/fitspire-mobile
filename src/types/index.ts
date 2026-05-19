export type Gender = 'male' | 'female' | 'other';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type TrainingPace = 'slow' | 'moderate' | 'fast';

export type ExerciseCategory = 'All' | 'Chest' | 'Back' | 'Arms' | 'Core' | 'Legs';

export interface UserProfile {
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  goalWeight: number;
  experience: ExperienceLevel;
  maxReps: number;
  trainingDays: number[];
  sessionDuration: number;
  pace: TrainingPace;
  onboardingCompleted: boolean;
}

export interface Set {
  id: string;
  kg: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  imageUrl: string;
  videoUrl: string;
  instructions: string[];
  defaultSets: number;
  defaultReps: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
  duration: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: Set[];
  restTimer?: number;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface DailyActivity {
  date: string;
  steps: number;
  caloriesBurned: number;
  sleepHours: number;
  waterGlasses: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  type: 'weight' | 'steps' | 'calories' | 'water' | 'sleep';
  current: number;
  target: number;
  unit: string;
}
