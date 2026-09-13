import { z } from 'zod';

const grokKeySchema = z.string().min(1);

// Build dynamic Grok key array — checks KEY_1, KEY_2, ... KEY_10
const grokKeys: string[] = [];
for (let i = 1; i <= 10; i++) {
  const key = process.env[`GROK_API_KEY_${i}`];
  if (key && key.trim().length > 0) {
    grokKeys.push(key.trim());
  }
}

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),

  GROK_MODEL: z.string().default('grok-3-fast'),
  GROK_MAX_TOKENS: z.string().default('2048').transform(Number),
  GROK_TIMEOUT_MS: z.string().default('30000').transform(Number),

  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./uploads'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().default('anti-claude-attachments'),

  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3001'),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
});

// Fail fast if required env vars are missing
const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const geminiKey = process.env.GEMINI_API_KEY?.trim();
if (grokKeys.length === 0 && !geminiKey) {
  console.error('❌ At least one AI API key (GEMINI_API_KEY or GROK_API_KEY_1) is required');
  process.exit(1);
}

export const env = {
  ..._parsed.data,
  GEMINI_API_KEY: geminiKey,
  GROK_API_KEYS: grokKeys,
  IS_PRODUCTION: _parsed.data.NODE_ENV === 'production',
  IS_DEVELOPMENT: _parsed.data.NODE_ENV === 'development',
  CORS_ORIGINS: _parsed.data.CORS_ORIGIN.split(',').map((s) => s.trim()),
};

export type Env = typeof env;
