import { z } from 'zod';

export function validateLocalDatabaseUrl(value: string): string {
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.pathname !== '/pghelm' || url.search || url.hash || !url.username || !url.password) {
    throw new Error('Use an explicit local pghelm database URL without query parameters');
  }
  return value;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = z.object({
    DATABASE_URL: z.string().min(1),
    QUEUE_NAME: z.string().regex(/^[a-z][a-z0-9_]{0,62}$/).default('pghelm_demo'),
    CONSUMER_NAME: z.string().regex(/^[a-z][a-z0-9_]{0,62}$/).default('pghelm_demo_consumer'),
    POOL_MAX: z.coerce.number().int().min(1).max(16).default(4),
  }).safeParse(env);
  if (!parsed.success) throw new Error('Invalid configuration: set DATABASE_URL and valid queue, consumer, and pool bounds');
  return {
    databaseUrl: validateLocalDatabaseUrl(parsed.data.DATABASE_URL),
    queue: parsed.data.QUEUE_NAME,
    consumer: parsed.data.CONSUMER_NAME,
    poolMax: parsed.data.POOL_MAX,
  };
}
