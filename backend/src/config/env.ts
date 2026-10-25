import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().default('guzomate-dev-jwt-super-secret-key-change-in-prod-32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  CORS_ORIGIN: z.string().default('*'),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),
  // Member 3: Travel Services Configuration
  WEATHER_API_KEY: z.string().optional(),
  WEATHER_URL: z.string().default('https://api.weatherapi.com/v1'),
  WEATHER_CACHE_TTL_MINUTES: z.coerce.number().default(20),
  WEATHER_REQUEST_TIMEOUT_MS: z.coerce.number().default(10000),
  OSRM_BASE_URL: z.string().default('https://router.project-osrm.org'),
  ROUTING_REQUEST_TIMEOUT_MS: z.coerce.number().default(10000),
  ADDIS_AI_API_KEY: z.string().optional(),
  ADDIS_AI_BASE_URL: z.string().default('https://api.addisassistant.com'),
  SPEECH_MAX_AUDIO_SIZE_BYTES: z.coerce.number().default(10 * 1024 * 1024),
  SPEECH_REQUEST_TIMEOUT_MS: z.coerce.number().default(15000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
