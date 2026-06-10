import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../api/config';
import type { Exercise, ExerciseCategory, Difficulty, Equipment } from '../types';

const CACHE_VERSION = 2;
const CACHE_PREFIX = `exercisedb-v${CACHE_VERSION}-`;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
const OSS_PAGE_LIMIT = 50;

let _ossFallbackActive = false;

function apiKey(): string {
  return API_CONFIG.exercisedbApiKey;
}

function isPlaceholderKey(): boolean {
  const key = apiKey();
  return !key || key === 'PASTE_YOUR_RAPIDAPI_KEY_HERE';
}

function usingOss(): boolean {
  return isPlaceholderKey() || _ossFallbackActive;
}

// ──────────────────────────────────────────
// Image URL builders
// ──────────────────────────────────────────

function getCardImageUrl(exerciseId: string): string {
  if (usingOss()) return `https://static.exercisedb.dev/media/${exerciseId}.gif`;
  return `${API_CONFIG.exercisedbBaseUrl}/image?exerciseId=${exerciseId}&resolution=180&rapidapi-key=${apiKey()}`;
}

function getDetailImageUrl(exerciseId: string): string {
  if (usingOss()) return `https://static.exercisedb.dev/media/${exerciseId}.gif`;
  return `${API_CONFIG.exercisedbBaseUrl}/image?exerciseId=${exerciseId}&resolution=360&rapidapi-key=${apiKey()}`;
}

function getGifUrl(exerciseId: string): string {
  if (usingOss()) return `https://static.exercisedb.dev/media/${exerciseId}.gif`;
  return `${API_CONFIG.exercisedbBaseUrl}/image?exerciseId=${exerciseId}&resolution=360&rapidapi-key=${apiKey()}`;
}

// ──────────────────────────────────────────
// RapidAPI — types, normalizer, fetch
// ──────────────────────────────────────────

interface RapidExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  secondaryMuscles: string[];
  instructions: string[];
  description?: string;
  difficulty: string;
  category: string;
}

const BODY_PART_TO_CATEGORY: Record<string, ExerciseCategory> = {
  back: 'Back',
  cardio: 'Core',
  chest: 'Chest',
  'lower arms': 'Arms',
  'lower legs': 'Legs',
  neck: 'Core',
  shoulders: 'Shoulder',
  'upper arms': 'Arms',
  'upper legs': 'Legs',
  waist: 'Core',
};

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const EQUIPMENT_MAP: Record<string, Equipment> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  'body weight': 'Bodyweight',
  body_weight: 'Bodyweight',
  bodyweight: 'Bodyweight',
  machine: 'Machine',
  cable: 'Cable',
  kettlebell: 'Kettlebell',
  bands: 'Band',
  band: 'Band',
  resistance: 'Band',
  'resistance band': 'Band',
  'foam roll': 'Bodyweight',
  other: 'Bodyweight',
  'medicine ball': 'Dumbbell',
  'exercise ball': 'Bodyweight',
  'e-z curl bar': 'Barbell',
  assisted: 'Bodyweight',
};

function normalizeRapidExercise(raw: RapidExercise): Exercise {
  const bodyKey = (raw.bodyPart || '').toLowerCase();
  const diffKey = (raw.difficulty || '').toLowerCase();
  const equipKey = (raw.equipment || '').toLowerCase();

  const category = BODY_PART_TO_CATEGORY[bodyKey] || 'Chest';
  const difficulty = DIFFICULTY_MAP[diffKey] || 'Intermediate';
  const equipment = EQUIPMENT_MAP[equipKey] || 'Bodyweight';

  const muscles = [raw.target, ...(raw.secondaryMuscles || [])].filter(Boolean);
  const id = raw.id;

  return {
    id,
    name: raw.name || 'Unknown Exercise',
    category,
    imageUrl: getCardImageUrl(id),
    videoUrl: '',
    instructions: raw.instructions || [],
    defaultSets: 3,
    defaultReps: 10,
    equipment,
    difficulty,
    restSeconds: category === 'Core' ? 30 : 90,
    targetMuscles: muscles.length > 0 ? muscles : [category],
    bodyPart: raw.bodyPart,
    primaryTarget: raw.target,
    secondaryMuscles: raw.secondaryMuscles || [],
    gifUrl: getGifUrl(id),
    imageUrls: [getCardImageUrl(id)],
    description: raw.description || '',
  };
}

function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

async function fetchRapidApi<T>(endpoint: string): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error('Workout API key is missing. Configure ExerciseDB API key.');
  if (key === 'PASTE_YOUR_RAPIDAPI_KEY_HERE') throw new Error('Workout API key is missing. Configure ExerciseDB API key.');

  const url = `${API_CONFIG.exercisedbBaseUrl}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    });
  } catch {
    throw new Error('Network connection issue. Check your internet connection.');
  }

  if (!response.ok) {
    if (isAuthError(response.status)) throw new Error('Workout API authentication failed. Check your ExerciseDB API key.');
    if (response.status === 429) throw new Error('Workout API rate limit reached. Try again later.');
    throw new Error(`Workout API error (${response.status}). Try again.`);
  }

  return response.json();
}

// ──────────────────────────────────────────
// OSS — types, normalizer, fetch
// ──────────────────────────────────────────

interface OssExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

interface OssResponse<T> {
  success: boolean;
  meta: { total: number; hasNextPage: boolean; hasPreviousPage: boolean; nextCursor?: string };
  data: T;
}

function normalizeOssExercise(raw: OssExercise): Exercise {
  const bodyPart = raw.bodyParts?.[0] || '';
  const bodyKey = bodyPart.toLowerCase();
  const equipKey = raw.equipments?.[0]?.toLowerCase() || '';
  const category = BODY_PART_TO_CATEGORY[bodyKey] || 'Chest';
  const equipment = EQUIPMENT_MAP[equipKey] || 'Bodyweight';
  const id = raw.exerciseId;

  const targetSet = new Set([
    ...(raw.targetMuscles || []),
    ...(raw.secondaryMuscles || []),
  ]);

  return {
    id,
    name: raw.name || 'Unknown Exercise',
    category,
    imageUrl: raw.gifUrl || getCardImageUrl(id),
    videoUrl: '',
    instructions: raw.instructions || [],
    defaultSets: 3,
    defaultReps: 10,
    equipment,
    difficulty: 'Intermediate',
    restSeconds: 90,
    targetMuscles: [...targetSet].filter(Boolean),
    bodyPart,
    primaryTarget: raw.targetMuscles?.[0] || '',
    secondaryMuscles: raw.secondaryMuscles || [],
    gifUrl: raw.gifUrl || getGifUrl(id),
    imageUrls: [raw.gifUrl || getCardImageUrl(id)],
    description: '',
  };
}

async function fetchOssApi<T>(endpoint: string, timeoutMs = 10000): Promise<T> {
  const url = `${API_CONFIG.exercisedbOssBaseUrl}${endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`OSS error: ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOssExercisesPage(offset = 0, limit = OSS_PAGE_LIMIT): Promise<OssExercise[]> {
  const res = await fetchOssApi<OssResponse<OssExercise[]>>(`/exercises?offset=${offset}&limit=${limit}`);
  return res.data || [];
}

async function fetchAllOssExercises(): Promise<OssExercise[]> {
  const all: OssExercise[] = [];
  let offset = 0;
  while (true) {
    const res = await fetchOssApi<OssResponse<OssExercise[]>>(`/exercises?offset=${offset}&limit=${OSS_PAGE_LIMIT}`);
    if (!res.data || res.data.length === 0) break;
    all.push(...res.data);
    if (!res.meta.hasNextPage) break;
    offset += OSS_PAGE_LIMIT;
  }
  return all;
}

// ──────────────────────────────────────────
// Cache helpers
// ──────────────────────────────────────────

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) return parsed.data as T;
  } catch {}
  return null;
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

function tryRapid<T>(fn: () => Promise<T>): Promise<T> {
  if (usingOss()) throw new Error('OSS mode');
  return fn().catch((err) => {
    _ossFallbackActive = true;
    throw err;
  });
}

async function withFallback<T>(
  rapidFn: () => Promise<T>,
  ossFn: () => Promise<T>,
): Promise<T> {
  let rapidErr: unknown;
  try {
    return await tryRapid(rapidFn);
  } catch (e) {
    rapidErr = e;
  }
  try {
    return await ossFn();
  } catch {
    if (rapidErr instanceof Error) throw rapidErr;
    throw new Error('Failed to load data. Try again.');
  }
}

// ──────────────────────────────────────────
// Exported public API
// ──────────────────────────────────────────

export async function fetchExercises(
  offset = 0,
  limit = 10,
): Promise<{ exercises: Exercise[]; total: number }> {
  const cacheKey = `exercises-${offset}-${limit}`;
  const cached = await getCached<{ exercises: Exercise[]; total: number }>(cacheKey);
  if (cached) return cached;

  const exercises = await withFallback(
    () => fetchRapidApi<RapidExercise[]>(`/exercises?offset=${offset}&limit=${limit}`).then(r => r.map(normalizeRapidExercise)),
    () => fetchOssExercisesPage(offset, limit).then(r => r.map(normalizeOssExercise)),
  );

  const result = { exercises, total: exercises.length };
  await setCache(cacheKey, result);
  return result;
}

export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  const cacheKey = `exercise-${id}`;
  const cached = await getCached<Exercise>(cacheKey);
  if (cached) return cached;

  try {
    const exercise = await withFallback(
      () => fetchRapidApi<RapidExercise>(`/exercises/exercise/${id}`).then(normalizeRapidExercise),
      async () => {
        const all = await fetchAllOssExercises();
        const match = all.find((e) => e.exerciseId === id);
        if (!match) throw new Error('Exercise not found');
        return normalizeOssExercise(match);
      },
    );
    await setCache(cacheKey, exercise);
    return exercise;
  } catch {
    return null;
  }
}

export async function fetchExercisesByBodyPart(
  bodyPart: string,
  offset = 0,
  limit = 10,
): Promise<Exercise[]> {
  const cacheKey = `bodyPart-${bodyPart}-${offset}-${limit}`;
  const cached = await getCached<Exercise[]>(cacheKey);
  if (cached) return cached;

  const exercises = await withFallback(
    () => fetchRapidApi<RapidExercise[]>(
      `/exercises/bodyPart/${encodeURIComponent(bodyPart)}?offset=${offset}&limit=${limit}`,
    ).then(r => r.map(normalizeRapidExercise)),
    async () => {
      const all = await fetchAllOssExercises();
      const filtered = all.filter((e) =>
        e.bodyParts?.some((bp) => bp.toLowerCase() === bodyPart.toLowerCase()),
      );
      return filtered.slice(offset, offset + limit).map(normalizeOssExercise);
    },
  );

  await setCache(cacheKey, exercises);
  return exercises;
}

export async function fetchExercisesByEquipment(
  equipment: string,
  offset = 0,
  limit = 10,
): Promise<Exercise[]> {
  const cacheKey = `equipment-${equipment}-${offset}-${limit}`;
  const cached = await getCached<Exercise[]>(cacheKey);
  if (cached) return cached;

  const exercises = await withFallback(
    () => fetchRapidApi<RapidExercise[]>(
      `/exercises/equipment/${encodeURIComponent(equipment)}?offset=${offset}&limit=${limit}`,
    ).then(r => r.map(normalizeRapidExercise)),
    async () => {
      const all = await fetchAllOssExercises();
      const filtered = all.filter((e) =>
        e.equipments?.some((eq) => eq.toLowerCase() === equipment.toLowerCase()),
      );
      return filtered.slice(offset, offset + limit).map(normalizeOssExercise);
    },
  );

  await setCache(cacheKey, exercises);
  return exercises;
}

export async function fetchExercisesByTarget(
  target: string,
  offset = 0,
  limit = 10,
): Promise<Exercise[]> {
  const cacheKey = `target-${target}-${offset}-${limit}`;
  const cached = await getCached<Exercise[]>(cacheKey);
  if (cached) return cached;

  const exercises = await withFallback(
    () => fetchRapidApi<RapidExercise[]>(
      `/exercises/target/${encodeURIComponent(target)}?offset=${offset}&limit=${limit}`,
    ).then(r => r.map(normalizeRapidExercise)),
    async () => {
      const all = await fetchAllOssExercises();
      const filtered = all.filter((e) =>
        e.targetMuscles?.some((tm) => tm.toLowerCase() === target.toLowerCase()),
      );
      return filtered.slice(offset, offset + limit).map(normalizeOssExercise);
    },
  );

  await setCache(cacheKey, exercises);
  return exercises;
}

export async function searchExercisesByName(
  name: string,
  offset = 0,
  limit = 10,
): Promise<Exercise[]> {
  const q = name.toLowerCase().trim();
  if (!q) return [];

  const cacheKey = `name-${q}-${offset}-${limit}`;
  const cached = await getCached<Exercise[]>(cacheKey);
  if (cached) return cached;

  const exercises = await withFallback(
    () => fetchRapidApi<RapidExercise[]>(
      `/exercises/name/${encodeURIComponent(q)}?offset=${offset}&limit=${limit}`,
    ).then(r => r.map(normalizeRapidExercise)),
    async () => {
      const all = await fetchAllOssExercises();
      const filtered = all.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.bodyParts?.some((bp) => bp.toLowerCase().includes(q)) ||
          e.targetMuscles?.some((tm) => tm.toLowerCase().includes(q)) ||
          e.equipments?.some((eq) => eq.toLowerCase().includes(q)),
      );
      return filtered.slice(offset, offset + limit).map(normalizeOssExercise);
    },
  );

  await setCache(cacheKey, exercises);
  return exercises;
}

export async function fetchBodyPartList(): Promise<string[]> {
  const cacheKey = 'bodyPartList';
  const cached = await getCached<string[]>(cacheKey);
  if (cached) return cached;

  const parts = await withFallback(
    () => fetchRapidApi<string[]>('/exercises/bodyPartList'),
    async () => {
      const all = await fetchOssExercisesPage(0, 100);
      return [...new Set(all.flatMap((e) => e.bodyParts || []))].sort();
    },
  );

  await setCache(cacheKey, parts);
  return parts;
}

export async function fetchEquipmentList(): Promise<string[]> {
  const cacheKey = 'equipmentList';
  const cached = await getCached<string[]>(cacheKey);
  if (cached) return cached;

  const equipment = await withFallback(
    () => fetchRapidApi<string[]>('/exercises/equipmentList'),
    async () => {
      const all = await fetchOssExercisesPage(0, 100);
      return [...new Set(all.flatMap((e) => e.equipments || []))].sort();
    },
  );

  await setCache(cacheKey, equipment);
  return equipment;
}

export async function fetchTargetList(): Promise<string[]> {
  const cacheKey = 'targetList';
  const cached = await getCached<string[]>(cacheKey);
  if (cached) return cached;

  const targets = await withFallback(
    () => fetchRapidApi<string[]>('/exercises/targetList'),
    async () => {
      const all = await fetchOssExercisesPage(0, 100);
      return [...new Set(all.flatMap((e) => e.targetMuscles || []))].sort();
    },
  );

  await setCache(cacheKey, targets);
  return targets;
}

export async function fetchAllExercisesDb(): Promise<Exercise[]> {
  const cacheKey = 'all-exercises';
  const cached = await getCached<Exercise[]>(cacheKey);
  if (cached) return cached;

  const allExercises = await withFallback(
    () => fetchRapidApi<RapidExercise[]>('/exercises').then(r => r.map(normalizeRapidExercise)),
    () => fetchAllOssExercises().then(r => r.map(normalizeOssExercise)),
  );

  await setCache(cacheKey, allExercises);
  return allExercises;
}

async function fetchRapidExercisesPaginated(pageSize = 100): Promise<RapidExercise[]> {
  const all: RapidExercise[] = [];
  let offset = 0;
  while (true) {
    const page = await fetchRapidApi<RapidExercise[]>(
      `/exercises?offset=${offset}&limit=${pageSize}`,
    );
    if (!page || page.length === 0) break;
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
    if (offset > 5000) break;
  }
  return all;
}

export async function fetchAllExercisesPaginated(): Promise<Exercise[]> {
  const cacheKey = 'all-exercises-paginated';
  const cached = await getCached<Exercise[]>(cacheKey);
  if (cached) return cached;

  const allExercises = await withFallback(
    () => fetchRapidExercisesPaginated(100).then(r => r.map(normalizeRapidExercise)),
    () => fetchAllOssExercises().then(r => r.map(normalizeOssExercise)),
  );

  await setCache(cacheKey, allExercises);
  return allExercises;
}

export function clearExerciseDbCache(): Promise<void> {
  return AsyncStorage.clear();
}

export { getCardImageUrl, getDetailImageUrl, getGifUrl };
