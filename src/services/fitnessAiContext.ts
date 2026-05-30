import type { Exercise } from '../types';
import type { WorkoutPlan } from '../data/workoutPlans';

export interface CurrentExerciseContext {
  exerciseId: string;
  exerciseName: string;
  imageUrl?: string;
  gifUrl?: string;
  instructions?: string[];
  sets?: number;
  reps?: number;
  restTime?: number;
  difficulty?: string;
  equipment?: string;
  bodyPart?: string;
  targetMuscle?: string;
}

export interface CurrentWorkoutSessionContext {
  workoutTitle: string;
  exerciseName?: string;
  source?: string;
  totalExercises?: number;
  currentExerciseIndex?: number;
}

let currentExerciseOnDetailPage: CurrentExerciseContext | null = null;
let currentWorkoutSession: CurrentWorkoutSessionContext | null = null;

export function setCurrentExerciseForAI(exercise: Exercise | null): void {
  if (!exercise) {
    currentExerciseOnDetailPage = null;
    return;
  }
  currentExerciseOnDetailPage = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    imageUrl: exercise.imageUrl,
    gifUrl: exercise.gifUrl,
    instructions: exercise.instructions,
    sets: exercise.defaultSets,
    reps: exercise.defaultReps,
    restTime: exercise.restSeconds,
    difficulty: exercise.difficulty,
    equipment: exercise.equipment,
    bodyPart: exercise.bodyPart,
    targetMuscle: exercise.primaryTarget || exercise.targetMuscles?.[0],
  };
}

export function setCurrentWorkoutSessionForAI(plan: WorkoutPlan | null, exerciseIndex = 0): void {
  if (!plan) {
    currentWorkoutSession = null;
    return;
  }
  const current = plan.exercises[exerciseIndex];
  currentWorkoutSession = {
    workoutTitle: plan.title,
    exerciseName: current?.name,
    source: plan.source,
    totalExercises: plan.exerciseCount,
    currentExerciseIndex: exerciseIndex,
  };
}

export function getCurrentExerciseForAI(): CurrentExerciseContext | null {
  return currentExerciseOnDetailPage;
}

export function getCurrentWorkoutSessionForAI(): CurrentWorkoutSessionContext | null {
  return currentWorkoutSession;
}

export function clearFitnessAIScreenContext(): void {
  currentExerciseOnDetailPage = null;
  currentWorkoutSession = null;
}
