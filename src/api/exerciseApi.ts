import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise, ExerciseCategory, Difficulty, Equipment } from '../types';
import { API_CONFIG } from './config';

const CACHE_KEY = 'fitspire-exercises-cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
const CACHE_VERSION = 4;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000;

interface WorkoutXExercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  category: string;
  difficulty: string;
  met: number;
  caloriesPerMinute: number;
  instructions: string[];
  gifUrl: string;
}

interface RawExercise {
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
  id: string;
}

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  chest: 'Chest',
  back: 'Back',
  upper_arms: 'Arms',
  lower_arms: 'Arms',
  shoulders: 'Shoulder',
  upper_legs: 'Legs',
  lower_legs: 'Legs',
  waist: 'Core',
  neck: 'Core',
  cardio: 'Core',
};

const BODY_PART_TO_CATEGORY: Record<string, ExerciseCategory> = {
  back: 'Back',
  cardio: 'Core',
  chest: 'Chest',
  lower_arms: 'Arms',
  lower_legs: 'Legs',
  neck: 'Core',
  shoulders: 'Shoulder',
  upper_arms: 'Arms',
  upper_legs: 'Legs',
  waist: 'Core',
};

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Advanced',
};

const EQUIPMENT_MAP: Record<string, Equipment> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  body_weight: 'Bodyweight',
  'body weight': 'Bodyweight',
  machine: 'Machine',
  cable: 'Cable',
  kettlebell: 'Kettlebell',
  bands: 'Band',
  'foam roll': 'Bodyweight',
  other: 'Bodyweight',
  'medicine ball': 'Dumbbell',
  'exercise ball': 'Bodyweight',
  'e-z curl bar': 'Barbell',
  assisted: 'Bodyweight',
  resistance_band: 'Band',
};

function mapWorkoutXExercise(raw: WorkoutXExercise): Exercise {
  const bodyKey = (raw.bodyPart || '').toLowerCase().replace(/\s+/g, '_');
  const diffKey = (raw.difficulty || '').toLowerCase();
  const equipKey = (raw.equipment || '').toLowerCase();

  const category = BODY_PART_TO_CATEGORY[bodyKey] || 'Chest';

  const difficulty = DIFFICULTY_MAP[diffKey] || 'Intermediate';
  const equipment = EQUIPMENT_MAP[equipKey] || 'Bodyweight';

  const muscles = [
    raw.target,
    ...(raw.secondaryMuscles || []),
  ].filter(Boolean);

  const exercise: Exercise = {
    id: raw.id || `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: raw.name || 'Unknown Exercise',
    category,
    imageUrl: raw.gifUrl || '',
    videoUrl: '',
    instructions: raw.instructions || [],
    defaultSets: 3,
    defaultReps: 10,
    equipment,
    difficulty,
    restSeconds: category === 'Core' ? 30 : 90,
    targetMuscles: muscles.length > 0 ? muscles : [category],
    formGuide: raw.instructions?.length > 0
      ? {
          setup: raw.instructions[0] || '',
          movement: raw.instructions.slice(1).join('. ') || '',
          breathing: 'Breathe steadily throughout the movement.',
          mistakes: 'Maintain proper form and control.',
          safety: 'Start with light weight and focus on form.',
          easyOption: 'Reduce the weight or range of motion and focus on proper form.',
        }
      : undefined,
  };

  return exercise;
}

function mapExercise(raw: RawExercise): Exercise {
  const catKey = (raw.category || '').toLowerCase();
  const diffKey = (raw.level || '').toLowerCase();
  const equipKey = (raw.equipment || '').toLowerCase();
  const category = CATEGORY_MAP[catKey] || 'Chest';
  const difficulty = DIFFICULTY_MAP[diffKey] || 'Intermediate';
  const equipment = EQUIPMENT_MAP[equipKey] || 'Bodyweight';

  const muscles = [
    ...(raw.primaryMuscles || []),
    ...(raw.secondaryMuscles || []),
  ];

  const imageUrl = Array.isArray(raw.images) && raw.images[0]
    ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${raw.images[0]}`
    : `https://placehold.co/400x300/1E293B/6C63FF?text=${encodeURIComponent(raw.name || 'Exercise')}`;

  if (__DEV__ && raw.images?.length) {
    console.log('[exerciseApi] image URL:', raw.images[0], '\u2192', imageUrl);
  }

  const exercise: Exercise = {
    id: raw.id || `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: raw.name || 'Unknown Exercise',
    category,
    imageUrl,
    videoUrl: '',
    instructions: raw.instructions || [],
    defaultSets: 3,
    defaultReps: 10,
    equipment,
    difficulty,
    restSeconds: raw.category?.toLowerCase() === 'cardio' ? 30 : 90,
    targetMuscles: muscles.length > 0 ? muscles : [category],
    formGuide: raw.instructions?.length > 0
      ? {
          setup: raw.instructions[0] || '',
          movement: raw.instructions.slice(1).join('. ') || '',
          breathing: 'Breathe steadily throughout the movement.',
          mistakes: 'Maintain proper form and control.',
          safety: 'Start with light weight and focus on form.',
          easyOption: 'Reduce the weight or range of motion and focus on proper form.',
        }
      : undefined,
  };

  if (__DEV__ && raw.primaryMuscles?.length) {
    console.log('[exerciseApi] mapped:', raw.name, { targetMuscles: muscles, equipment, difficulty, instructions: raw.instructions?.length });
  }

  return exercise;
}

async function fetchWithTimeout(url: string, timeoutMs: number, headers?: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWorkoutXExercises(): Promise<Exercise[]> {
  if (!API_CONFIG.workoutxKey) {
    throw new Error('WorkoutX API key not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = `${API_CONFIG.workoutxBaseUrl}/v1/exercises?limit=1000`;
      const response = await fetchWithTimeout(
        url,
        REQUEST_TIMEOUT_MS,
        { 'X-WorkoutX-Key': API_CONFIG.workoutxKey }
      );

      if (response.status === 401) {
        throw new Error('Invalid WorkoutX API key');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const rawData: WorkoutXExercise[] = await response.json();
      if (!Array.isArray(rawData)) throw new Error('Invalid response format');

      return rawData.map(mapWorkoutXExercise);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
    }

    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  throw lastError || new Error('Failed to fetch exercises from WorkoutX');
}

const FALLBACK_DB_URLS = [
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
];

async function fetchFallbackExercises(): Promise<Exercise[]> {
  let lastError: Error | null = null;

  for (const url of FALLBACK_DB_URLS) {
    try {
      const response = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawData: RawExercise[] = await response.json();
      if (!Array.isArray(rawData)) throw new Error('Invalid response format');
      return rawData.map(mapExercise);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
    }
  }

  throw lastError || new Error('Failed to fetch fallback exercises');
}

export async function fetchAllExercises(): Promise<Exercise[]> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        const { data, timestamp, version } = parsed;
        if (
          version === CACHE_VERSION &&
          Date.now() - timestamp < CACHE_DURATION_MS &&
          Array.isArray(data)
        ) {
          return data as Exercise[];
        }
      }
    }
  } catch {}

  let exercises: Exercise[];

  try {
    exercises = await fetchWorkoutXExercises();
  } catch (workoutXError) {
    if (__DEV__) {
      console.warn('[exerciseApi] WorkoutX failed, trying fallback:', workoutXError);
    }
    try {
      exercises = await fetchFallbackExercises();
    } catch {
      throw workoutXError;
    }
  }

  try {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data: exercises, timestamp: Date.now(), version: CACHE_VERSION })
    );
  } catch {}

  return exercises;
}

export async function fetchExercisesByCategory(category: ExerciseCategory): Promise<Exercise[]> {
  try {
    const all = await fetchAllExercises();
    if (category === 'All') return all;
    return all.filter((e) => e && e.category === category);
  } catch {
    return [];
  }
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  try {
    const all = await fetchAllExercises();
    const q = query.toLowerCase();
    return all.filter(
      (e) =>
        e &&
        e.name &&
        (e.name.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.equipment?.toLowerCase().includes(q))
    );
  } catch {
    return [];
  }
}

export function clearExerciseCache(): Promise<void> {
  return AsyncStorage.removeItem(CACHE_KEY);
}

const PAGE_SIZE = 20;

export async function fetchPage(page: number, pageSize: number = PAGE_SIZE): Promise<{ exercises: Exercise[]; total: number }> {
  const all = await fetchAllExercises();
  const total = Array.isArray(all) ? all.length : 0;
  const start = (page - 1) * pageSize;
  const exercises = Array.isArray(all) ? all.slice(start, start + pageSize) : [];
  return { exercises, total };
}

export { PAGE_SIZE };
