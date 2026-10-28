import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

dotenv.config({ path: process.env.ENV_FILE || resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_mystery_room',
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieName: process.env.SESSION_COOKIE_NAME || 'ai_mystery_session',
  timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 60000),
  repairAttempts: Math.min(2, Math.max(0, Number(process.env.MAX_GENERATION_REPAIR_ATTEMPTS || 2)))
};
