export const env = {
  EXERCISEDB_API_KEY: process.env.EXPO_PUBLIC_EXERCISEDB_API_KEY || '',
  EXERCISEDB_BASE_URL: process.env.EXPO_PUBLIC_EXERCISEDB_BASE_URL || 'https://exercisedb.p.rapidapi.com',
  EXERCISEDB_OSS_BASE_URL: 'https://oss.exercisedb.dev/api/v1',
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  GROQ_MODEL: process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama-3.1-8b-instant',
  GROQ_BASE_URL: 'https://api.groq.com/openai/v1',
};
