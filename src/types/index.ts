export type Gender = 'male' | 'female' | 'other';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'general_fitness' | 'improve_stamina' | 'stay_active' | 'improve_flexibility';

export type TrainingPace = 'slow' | 'moderate' | 'fast';

export type ExerciseCategory = 'All' | 'Chest' | 'Back' | 'Arms' | 'Core' | 'Legs' | 'Shoulder';

export type HeightUnit = 'cm' | 'ft_in';
export type WeightUnit = 'kg';
export type DistanceUnit = 'km';

export interface UserProfile {
  gender: Gender;
  age: number;
  height: number;
  heightUnit: HeightUnit;
  weight: number;
  fitnessGoal: FitnessGoal;
  experience: ExperienceLevel;
  onboardingCompleted: boolean;
  stepGoal: number;
  workoutDaysPerWeek: number;
  preferredWorkoutDuration: number;
  maxReps?: number;
  trainingDays?: number[];
  sessionDuration?: number;
  pace?: TrainingPace;
  goalWeight?: number;
}

export interface Set {
  id: string;
  kg: number;
  reps: number;
  completed: boolean;
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Bodyweight'
  | 'Machine'
  | 'Cable'
  | 'Kettlebell'
  | 'Band';

export interface FormGuide {
  setup: string;
  movement: string;
  breathing: string;
  mistakes: string;
  safety: string;
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
  equipment: Equipment;
  difficulty: Difficulty;
  restSeconds: number;
  formGuide?: FormGuide;
  targetMuscles: string[];
  bodyPart?: string;
  primaryTarget?: string;
  secondaryMuscles?: string[];
  gifUrl?: string;
  imageUrls?: string[];
  description?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: Set[];
  restTimer?: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
  duration: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  name?: string;
  calories?: number;
}

export interface CompletedWorkout {
  workoutId: string;
  workoutTitle: string;
  completedAt: string;
  duration: number;
  exercisesCompleted: number;
  totalExercises: number;
  calories: number;
  category: string;
  difficulty: string;
  targetMuscles: string[];
  planId?: string;
  source?: string;
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
  type?: 'warning' | 'info' | 'error' | 'achievement';
  actionText?: string;
  actionRoute?: string;
  persistent?: boolean;
  dismissible?: boolean;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Goal {
  id: string;
  type: 'weight' | 'steps' | 'calories' | 'water' | 'sleep';
  current: number;
  target: number;
  unit: string;
}

export type TrainingMode = 'walking' | 'running' | 'riding';

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface TrainingSession {
  id: string;
  mode: TrainingMode;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  steps: number;
  calories: number;
  route: Coordinate[];
  avgPace: string;
  status: 'completed';
}

export interface ActiveSession {
  id: string;
  activityType: TrainingMode;
  status: 'idle' | 'running' | 'paused';
  startTime: string | null;
  endTime: string | null;
  pausedDurationMs: number;
  lastPausedAt: string | null;
  durationSeconds: number;
  steps: number;
  distanceKm: number;
  calories: number;
  route: Coordinate[];
  createdAt: string;
}
