import type { Exercise, Difficulty } from '../types';

interface NormalizedSet {
  sets: number;
  reps: number;
  restSeconds: number;
}

function setsForDifficulty(difficulty: Difficulty): NormalizedSet {
  switch (difficulty) {
    case 'Beginner':
      return { sets: 3, reps: 10, restSeconds: 60 };
    case 'Intermediate':
      return { sets: 4, reps: 10, restSeconds: 75 };
    case 'Advanced':
      return { sets: 4, reps: 8, restSeconds: 90 };
  }
}

export function normalizeWithDifficulty(exercise: Exercise): Exercise {
  const { sets, reps, restSeconds } = setsForDifficulty(exercise.difficulty);
  return {
    ...exercise,
    defaultSets: sets,
    defaultReps: reps,
    restSeconds,
  };
}
