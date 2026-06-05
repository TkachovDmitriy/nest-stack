import { z } from 'zod';

import { env } from './env.config';

export const redisConfigSchema = z.object({
  url: z.string().url(),
  retryAttempts: z.number().default(3),
  retryDelay: z.number().default(1000),
  ttl: z.number().default(300), // 5 minutes in seconds
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;

export const redisConfig: RedisConfig = {
  url: env.REDIS_URL || 'redis://:your_strong_password@localhost:6379/0',
  retryAttempts: 3,
  retryDelay: 1000,
  ttl: 300,
};
