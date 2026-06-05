import { z } from 'zod';

export const RecaptchaResponseSchema = z.object({
  success: z.boolean(),
  score: z.number().optional(),
  action: z.string().optional(),
  challenge_ts: z.string(),
  hostname: z.string(),
  'error-codes': z.array(z.string()).optional(),
});
