import { exercises } from './exercises';
import { fetchAllExercisesPaginated } from '../services/exerciseDbApi';
import type { Exercise, ExerciseType } from '../types';
import { getFormGuide } from './exerciseFormGuides';

const WEIGHT_EQUIPMENT = new Set([
  'Dumbbell',
  'Barbell',
  'Machine',
  'Cable',
  'Kettlebell',
]);

const TIME_KEYWORDS = [
  'plank',
  'hold',
  'wall sit',
  'bridge',
  'dead hang',
  'hollow',
  'stretch',
  'mountain climber',
  'high knees',
  'jumping jack',
];

export function deriveExerciseType(equipment: string, name: string): ExerciseType {
  const lower = (name || '').toLowerCase();
  if (TIME_KEYWORDS.some((k) => lower.includes(k))) return 'time';
  if (WEIGHT_EQUIPMENT.has(equipment)) return 'weight_reps';
  return 'bodyweight_reps';
}

export interface WorkoutPlanExercise {
  exerciseId: string;
  name: string;
  category: string;
  imageUrl: string;
  instructions: string[];
  sets: number;
  reps: number;
  restSeconds: number;
  equipment: string;
  difficulty: string;
  targetMuscles: string[];
  type: ExerciseType;
  formGuide?: {
    setup: string;
    movement: string;
    breathing: string;
    mistakes: string;
    safety: string;
    easyOption?: string;
  };
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  benefit: string;
  imageUrl: string;
  duration: number;
  difficulty: string;
  category: string;
  targetMuscles: string[];
  equipment: string[];
  calories: number;
  exercises: WorkoutPlanExercise[];
  exerciseCount: number;
  totalSets: number;
  source?: string;
}

const DIFFICULTY_ORDER: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

function getDifficultyLevel(d: string): number {
  return DIFFICULTY_ORDER[d] || 2;
}

let cachedPlans: WorkoutPlan[] | null = null;
let _usedApiSuccessfully = false;

export function usedApiSuccessfully(): boolean {
  return _usedApiSuccessfully;
}

const idCounter = { value: 0 };

function resetIdCounter() {
  idCounter.value = 0;
}

function generateWorkoutId(title: string): string {
  idCounter.value += 1;
  return `workout-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${idCounter.value}`;
}

function pickExercises(
  pool: Exercise[],
  count: number,
  maxDifficulty: string,
  preferredEquipment?: string
): Exercise[] {
  const maxLevel = getDifficultyLevel(maxDifficulty);
  let filtered = pool.filter((e) => getDifficultyLevel(e.difficulty) <= maxLevel);
  if (preferredEquipment && preferredEquipment !== 'Any') {
    const withEquip = filtered.filter((e) => e.equipment === preferredEquipment);
    if (withEquip.length >= count) {
      filtered = withEquip;
    }
  }
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function estimateCalories(difficulty: string, totalSets: number): number {
  const base = difficulty === 'Beginner' ? 5 : difficulty === 'Intermediate' ? 7 : 10;
  return totalSets * base;
}

function toWorkoutPlanExercise(ex: Exercise, sets?: number, reps?: number): WorkoutPlanExercise {
  return {
    exerciseId: ex.id,
    name: ex.name,
    category: ex.category,
    imageUrl: ex.imageUrl,
    instructions: ex.instructions,
    sets: sets ?? ex.defaultSets,
    reps: reps ?? ex.defaultReps,
    restSeconds: ex.restSeconds,
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    targetMuscles: ex.targetMuscles?.length ? ex.targetMuscles : [ex.category],
    type: deriveExerciseType(ex.equipment, ex.name),
    formGuide: ex.formGuide ?? getFormGuide({ name: ex.name, equipment: ex.equipment, instructions: ex.instructions }),
  };
}

export function buildWorkoutPlan(
  title: string,
  description: string,
  benefit: string,
  category: string,
  difficulty: string,
  exercisePool: Exercise[],
  exerciseCount: number,
  preferredEquipment?: string
): WorkoutPlan {
  const selected = pickExercises(exercisePool, exerciseCount, difficulty, preferredEquipment);
  const planExercises = selected.map((ex) => toWorkoutPlanExercise(ex));
  const totalSets = planExercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalMinutes = planExercises.reduce((sum, ex) => {
    const setTime = ex.reps * 3 + ex.restSeconds;
    return sum + Math.ceil((setTime * ex.sets) / 60);
  }, 0);
  const allMuscles = [...new Set(planExercises.flatMap((e) => e.targetMuscles))];
  const allEquip = [...new Set(planExercises.map((e) => e.equipment))];

  return {
    id: generateWorkoutId(title),
    title,
    description,
    benefit,
    imageUrl: selected[0]?.imageUrl || '',
    duration: Math.max(totalMinutes, 10),
    difficulty,
    category,
    targetMuscles: allMuscles,
    equipment: allEquip,
    calories: estimateCalories(difficulty, totalSets),
    exercises: planExercises,
    exerciseCount: planExercises.length,
    totalSets,
  };
}

export function generateWorkoutPlans(exerciseList: Exercise[]): WorkoutPlan[] {
  const byCategory: Record<string, Exercise[]> = {};
  for (const ex of exerciseList) {
    if (!byCategory[ex.category]) byCategory[ex.category] = [];
    byCategory[ex.category].push(ex);
  }

  const allExercises = exerciseList;
  const chest = byCategory.Chest || [];
  const back = byCategory.Back || [];
  const legs = byCategory.Legs || [];
  const arms = byCategory.Arms || [];
  const shoulder = byCategory.Shoulder || [];
  const core = byCategory.Core || [];

  const beginnerExercises = allExercises.filter((e) => e.difficulty === 'Beginner');
  const intermediateExercises = allExercises.filter((e) => e.difficulty === 'Intermediate');
  const advancedExercises = allExercises.filter((e) => e.difficulty === 'Advanced');
  const bodyweightExercises = allExercises.filter((e) => e.equipment === 'Bodyweight');
  const dumbbellExercises = allExercises.filter((e) => e.equipment === 'Dumbbell');
  const barbellExercises = allExercises.filter((e) => e.equipment === 'Barbell');

  const plans: WorkoutPlan[] = [];

  if (bodyweightExercises.length >= 3) {
    plans.push(
      buildWorkoutPlan(
        'Bodyweight Basics',
        'A complete bodyweight workout using only your own body. Perfect for home or travel.',
        'Builds functional strength, improves mobility, and requires no equipment - making it easy to stay consistent anywhere.',
        'Full Body',
        'Beginner',
        bodyweightExercises,
        Math.min(6, bodyweightExercises.length),
        'Bodyweight'
      )
    );
  }

  if (beginnerExercises.length >= 4) {
    plans.push(
      buildWorkoutPlan(
        'Beginner Full Body',
        'A well-rounded full body workout designed for beginners. Build strength and confidence.',
        'Builds full-body strength, improves coordination, and establishes proper form fundamentals for long-term progress.',
        'Full Body',
        'Beginner',
        beginnerExercises,
        Math.min(6, beginnerExercises.length)
      )
    );
  }

  if (chest.length >= 2 && arms.length >= 1) {
    const upperPool = [...chest, ...arms, ...shoulder];
    plans.push(
      buildWorkoutPlan(
        'Upper Body Pump',
        'Target your chest, shoulders, and arms with compound and isolation movements.',
        'Builds upper body strength, improves posture, and enhances pushing and pulling power for daily activities.',
        'Upper Body',
        'Intermediate',
        upperPool,
        Math.min(6, upperPool.length)
      )
    );
  }

  if (legs.length >= 2 && core.length >= 1) {
    const lowerPool = [...legs, ...core];
    plans.push(
      buildWorkoutPlan(
        'Lower Body Strength',
        'Build strong legs and a solid core with squats, lunges, and core work.',
        'Strengthens the foundation of your body - legs and core - improving stability, balance, and athletic performance.',
        'Lower Body',
        'Intermediate',
        lowerPool,
        Math.min(6, lowerPool.length)
      )
    );
  }

  if (chest.length >= 2 && back.length >= 2 && legs.length >= 1) {
    plans.push(
      buildWorkoutPlan(
        'Full Body Power',
        'A complete compound workout hitting every major muscle group. Maximum efficiency.',
        'Delivers full-body activation in every session, maximizing calorie burn and building balanced strength across all muscle groups.',
        'Full Body',
        'Intermediate',
        [...chest, ...back, ...legs, ...shoulder],
        Math.min(8, chest.length + back.length + legs.length + shoulder.length)
      )
    );
  }

  if (core.length >= 2) {
    plans.push(
      buildWorkoutPlan(
        'Core & Cardio',
        'Strengthen your core and get your heart rate up with dynamic movements.',
        'Building a strong core improves posture, prevents injury, and enhances performance in every other exercise you do.',
        'Core',
        'Beginner',
        core,
        Math.min(5, core.length)
      )
    );
  }

  if (dumbbellExercises.length >= 3) {
    plans.push(
      buildWorkoutPlan(
        'Dumbbell Strength',
        'A complete dumbbell-only workout for building muscle and strength at home or gym.',
        'Dumbbells offer versatile training that corrects muscle imbalances and engages stabilizer muscles for functional strength.',
        'Full Body',
        'Intermediate',
        dumbbellExercises,
        Math.min(6, dumbbellExercises.length),
        'Dumbbell'
      )
    );
  }

  if (arms.length >= 2 && shoulder.length >= 1) {
    const armPool = [...arms, ...shoulder];
    plans.push(
      buildWorkoutPlan(
        'Arms & Shoulders',
        'Sculpt your arms and shoulders with targeted bicep, tricep, and delt exercises.',
        'Builds aesthetic upper body definition and improves pushing/pulling strength for everyday tasks and other lifts.',
        'Upper Body',
        'Intermediate',
        armPool,
        Math.min(6, armPool.length)
      )
    );
  }

  if (chest.length >= 2) {
    plans.push(
      buildWorkoutPlan(
        'Chest Builder',
        'Focus on building a stronger, more defined chest with pressing and fly movements.',
        'Builds pushing power and upper body mass while improving shoulder stability and chest definition.',
        'Chest',
        'Intermediate',
        chest,
        Math.min(5, chest.length)
      )
    );
  }

  if (back.length >= 2) {
    plans.push(
      buildWorkoutPlan(
        'Back & Posture',
        'Strengthen your entire back for better posture and a powerful physique.',
        'A strong back improves posture, prevents injury, and creates the foundation for nearly every compound movement.',
        'Back',
        'Intermediate',
        back,
        Math.min(5, back.length)
      )
    );
  }

  if (legs.length >= 2) {
    plans.push(
      buildWorkoutPlan(
        'Leg Day',
        'Build powerful legs with compound leg exercises and targeted isolation work.',
        'Leg training boosts overall strength, increases testosterone response, and builds the largest muscle group in your body.',
        'Legs',
        'Advanced',
        legs,
        Math.min(5, legs.length)
      )
    );
  }

  if (barbellExercises.length >= 3) {
    plans.push(
      buildWorkoutPlan(
        'Barbell Strength',
        'Heavy compound barbell work for serious strength gains.',
        'Barbell training builds raw strength, improves bone density, and engages your entire body in every lift.',
        'Full Body',
        'Advanced',
        barbellExercises,
        Math.min(5, barbellExercises.length),
        'Barbell'
      )
    );
  }

  if (advancedExercises.length >= 4) {
    plans.push(
      buildWorkoutPlan(
        'Advanced Full Body',
        'High-intensity full body workout for experienced lifters.',
        'Challenges your body with advanced compound movements, maximizing strength gains and pushing past plateaus.',
        'Full Body',
        'Advanced',
        advancedExercises,
        Math.min(6, advancedExercises.length)
      )
    );
  }

  return plans;
}

export async function getWorkoutPlans(): Promise<WorkoutPlan[]> {
  if (cachedPlans) return cachedPlans;
  try {
    const apiExercises = await fetchAllExercisesPaginated();
    if (apiExercises.length > 5) {
      cachedPlans = generateWorkoutPlans(apiExercises);
      _usedApiSuccessfully = true;
      return cachedPlans;
    }
  } catch {}
  _usedApiSuccessfully = false;
  cachedPlans = generateWorkoutPlans(exercises);
  return cachedPlans;
}

export function getCachedPlans(): WorkoutPlan[] {
  return cachedPlans || [];
}

export function getWorkoutPlanById(plans: WorkoutPlan[], id: string): WorkoutPlan | undefined {
  return plans.find((p) => p.id === id);
}

export function filterWorkoutPlans(
  plans: WorkoutPlan[],
  category?: string,
  difficulty?: string,
  search?: string
): WorkoutPlan[] {
  let filtered = plans;
  if (category && category !== 'All') {
    filtered = filtered.filter(
      (p) => p.category === category || p.targetMuscles.some((m) => m.toLowerCase().includes(category.toLowerCase()))
    );
  }
  if (difficulty && difficulty !== 'All') {
    filtered = filtered.filter((p) => p.difficulty === difficulty);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.targetMuscles.some((m) => m.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }
  return filtered;
}
