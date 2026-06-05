import { z } from 'zod';

export const TwoFactorEnableSchema = z.object({
  email: z.string().email(),
});

export const TwoFactorVerifySchema = z.object({
  code: z.string().length(6),
});

export const TwoFactorLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  requiresTwoFactor: z.boolean(),
  twoFactorVerified: z.boolean(),
});
