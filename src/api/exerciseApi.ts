import { ExerciseCategory } from '../types';

const EXERCISE_IMAGE_BASE = 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises';

export async function fetchExerciseImages(category: ExerciseCategory): Promise<string[]> {
  try {
    const response = await fetch(`${EXERCISE_IMAGE_BASE}/${category.toLowerCase()}.json`);
    if (response.ok) {
      const data = await response.json();
      return data.images || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function searchExercises(query: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.github.com/search/repositories?q=${query}+exercise`);
    if (response.ok) {
      const data = await response.json();
      return data.items || [];
    }
    return [];
  } catch {
    return [];
  }
}
