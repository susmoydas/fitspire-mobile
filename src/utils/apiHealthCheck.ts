import { env } from '../config/env';

function status(value: string | undefined | null, name: string): string {
  const ok = value && value !== '' && !value.includes('PASTE_YOUR');
  return `${name}: ${ok ? 'loaded' : 'missing'}`;
}

export function checkApiHealth(): void {
  console.group('[API Health Check]');
  console.log(status(env.EXERCISEDB_API_KEY, 'ExerciseDB API Key'));
  console.log(status(env.EXERCISEDB_BASE_URL, 'ExerciseDB Base URL'));
  console.log(status(env.GEMINI_API_KEY, 'Gemini API Key'));
  console.log(status(env.GEMINI_MODEL, 'Gemini Model'));
  console.groupEnd();
}
