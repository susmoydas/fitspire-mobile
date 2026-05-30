import { env } from './env';

export const AI_CONFIG = {
  groqApiKey: env.GROQ_API_KEY,
  groqBaseUrl: env.GROQ_BASE_URL,
  groqModel: env.GROQ_MODEL,
};
