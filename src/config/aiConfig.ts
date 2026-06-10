import { env } from './env';

export const AI_CONFIG = {
  groqApiKey: env.GEMINI_API_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  groqBaseUrl: env.GEMINI_BASE_URL,
  geminiBaseUrl: env.GEMINI_BASE_URL,
  groqModel: env.GEMINI_MODEL,
  geminiModel: env.GEMINI_MODEL,
};
