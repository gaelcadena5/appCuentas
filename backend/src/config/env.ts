import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = [
  'PORT',
  'TELEGRAM_BOT_TOKEN',
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'WEBHOOK_URL'
];

for (const env of requiredEnv) {
  if (!process.env[env]) {
    throw new Error(`Falta la variable de entorno obligatoria: ${env}`);
  }
}

export const envs = {
  PORT: process.env.PORT || '3000',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  WEBHOOK_URL: process.env.WEBHOOK_URL!,
  ALLOWED_TELEGRAM_IDS: process.env.ALLOWED_TELEGRAM_IDS || ''
};
