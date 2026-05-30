import { Exercise } from '../types';
import { getCardImageUrl, getDetailImageUrl, getGifUrl } from '../services/exerciseDbApi';
import type { WorkoutPlanExercise } from '../data/workoutPlans';

const PLACEHOLDER_BASE = 'https://placehold.co';

/** Raw exercise-like object from API (multiple possible image field names). */
export type ExerciseImageFields = {
  id?: string;
  image?: string;
  imageUrl?: string;
  gifUrl?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  images?: string[];
  imageUrls?: string[];
  media?: Array<{ url?: string }>;
};

export function isGifUrl(url: string): boolean {
  return url?.toLowerCase().endsWith('.gif') ?? false;
}

export function getAssetUrl(url: string, name: string): string {
  if (!url) {
    return `${PLACEHOLDER_BASE}/600x400/1E293B/6C63FF?text=${encodeURIComponent(name || 'Exercise')}`;
  }
  return url;
}

export function getFallbackAsset(name: string, muscle?: string): { uri: string } {
  const text = name || muscle || 'Exercise';
  return {
    uri: `${PLACEHOLDER_BASE}/600x400/1E293B/6C63FF?text=${encodeURIComponent(text)}`,
  };
}

function collectUrls(
  exercise: ExerciseImageFields & { id?: string },
  idFallback?: string,
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const id = exercise.id || idFallback;

  const add = (url?: string) => {
    if (url && typeof url === 'string' && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  add(exercise.gifUrl);
  add(exercise.imageUrl);
  add(exercise.image);
  add(exercise.thumbnail);
  add(exercise.thumbnailUrl);
  exercise.imageUrls?.forEach(add);
  exercise.images?.forEach(add);
  exercise.media?.forEach((m) => add(m?.url));

  if (id) {
    add(getGifUrl(id));
    add(getCardImageUrl(id));
    add(getDetailImageUrl(id));
  }

  return urls;
}

/** Collect unique image URLs to try, ordered by reliability. */
export function getExerciseImageUrls(
  exercise: ExerciseImageFields & Pick<Exercise, 'id' | 'imageUrl' | 'gifUrl' | 'imageUrls'>,
): string[] {
  return collectUrls(exercise, exercise.id);
}

/** Primary image URL for an Exercise. */
export function getExerciseImage(exercise: ExerciseImageFields & Pick<Exercise, 'id'>): string {
  const urls = getExerciseImageUrls(exercise as Exercise);
  const id = exercise.id;
  return urls[0] || (id ? getGifUrl(id) : '');
}

export function getExerciseImageUrl(
  exercise: ExerciseImageFields & Pick<Exercise, 'id' | 'imageUrl' | 'gifUrl' | 'imageUrls'>,
): string {
  return getExerciseImage(exercise as Exercise);
}

/** Image URLs for a workout-plan exercise entry. */
export function getWorkoutExerciseImageUrls(
  exercise: Pick<WorkoutPlanExercise, 'exerciseId' | 'imageUrl' | 'name'> & Partial<ExerciseImageFields>,
): string[] {
  const fields: ExerciseImageFields = {
    id: exercise.exerciseId,
    imageUrl: exercise.imageUrl,
    gifUrl: (exercise as any).gifUrl,
    image: (exercise as any).image,
    thumbnail: (exercise as any).thumbnail,
    thumbnailUrl: (exercise as any).thumbnailUrl,
    images: (exercise as any).images,
    imageUrls: (exercise as any).imageUrls,
    media: (exercise as any).media,
  };
  return collectUrls(fields, exercise.exerciseId);
}

export function getWorkoutExerciseImageUrl(
  exercise: Pick<WorkoutPlanExercise, 'exerciseId' | 'imageUrl' | 'name'>,
): string {
  return getWorkoutExerciseImageUrls(exercise)[0] || getGifUrl(exercise.exerciseId);
}

export function getCardImageSource(exercise: Exercise): { uri: string } {
  return { uri: getExerciseImageUrl(exercise) };
}

export function getDetailImageSource(exercise: Exercise): { uri: string } {
  const urls = getExerciseImageUrls(exercise);
  return {
    uri: urls.find((u) => u.includes('360') || u.includes('.gif')) || urls[0] || getDetailImageUrl(exercise.id),
  };
}

export function getGifSource(exercise: Exercise): { uri: string } | null {
  return { uri: getExerciseImageUrl(exercise) };
}

export function getThumbnailSource(exercise: Exercise): { uri: string } {
  return { uri: getExerciseImageUrl(exercise) };
}
