import { env } from '../config/env';

export const API_CONFIG = {
  workoutxKey: '',
  workoutxBaseUrl: 'https://api.workoutxapp.com',
  exercisedbApiKey: env.EXERCISEDB_API_KEY,
  exercisedbBaseUrl: env.EXERCISEDB_BASE_URL,
  exercisedbOssBaseUrl: env.EXERCISEDB_OSS_BASE_URL,
};
