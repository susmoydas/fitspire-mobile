import type { Exercise } from '../types';
import type { WorkoutPlan, WorkoutPlanExercise } from '../data/workoutPlans';
import { getExerciseImageUrl } from './image';

const SETS_REPS_BY_DIFFICULTY: Record<string, { sets: number; reps: number; rest: number }> = {
  Beginner: { sets: 3, reps: 10, rest: 60 },
  Intermediate: { sets: 4, reps: 10, rest: 75 },
  Advanced: { sets: 4, reps: 8, rest: 90 },
};

function estimateCalories(difficulty: string, totalSets: number): number {
  const base = difficulty === 'Beginner' ? 5 : difficulty === 'Intermediate' ? 7 : 10;
  return totalSets * base;
}

function normalizeInstructions(instructions: string[]): string[] {
  if (!instructions?.length) return [];
  return instructions.map((step) => step.replace(/^Step:\d+\s*/i, '').trim()).filter(Boolean);
}

export function exerciseToPlanExercise(ex: Exercise): WorkoutPlanExercise {
  const diff = ex.difficulty || 'Intermediate';
  const defaults = SETS_REPS_BY_DIFFICULTY[diff] || SETS_REPS_BY_DIFFICULTY.Intermediate;

  return {
    exerciseId: ex.id,
    name: ex.name,
    category: ex.category,
    imageUrl: getExerciseImageUrl(ex),
    instructions: normalizeInstructions(ex.instructions || []),
    sets: ex.defaultSets || defaults.sets,
    reps: ex.defaultReps || defaults.reps,
    restSeconds: ex.restSeconds || defaults.rest,
    equipment: ex.equipment || 'Bodyweight',
    difficulty: diff,
    targetMuscles: ex.targetMuscles?.length ? ex.targetMuscles : [ex.category],
    formGuide: ex.formGuide,
  };
}

/** Build a one-exercise plan for WorkoutTimer (same shape as home workout plans). */
export function buildSingleExerciseWorkoutPlan(exercise: Exercise): WorkoutPlan {
  const planExercise = exerciseToPlanExercise(exercise);
  const totalSets = planExercise.sets;
  const setTime = planExercise.reps * 3 + planExercise.restSeconds;
  const duration = Math.max(Math.ceil((setTime * planExercise.sets) / 60), 5);

  return {
    id: `single-${exercise.id}`,
    title: exercise.name,
    description: `Complete ${planExercise.sets} sets of ${planExercise.name} with proper form.`,
    benefit: 'Focus on controlled movement and steady breathing.',
    imageUrl: planExercise.imageUrl,
    duration,
    difficulty: planExercise.difficulty,
    category: exercise.category,
    targetMuscles: planExercise.targetMuscles,
    equipment: [planExercise.equipment],
    calories: estimateCalories(planExercise.difficulty, totalSets),
    exercises: [planExercise],
    exerciseCount: 1,
    totalSets,
    source: 'workouts_page',
  };
}
