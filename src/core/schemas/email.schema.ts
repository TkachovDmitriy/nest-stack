import { z } from 'zod';

export const BaseEmailDataSchema = z.object({
  firstName: z.string().min(1),
  supportEmail: z.string().email().optional(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});

export const VerificationEmailDataSchema = BaseEmailDataSchema.extend({
  verificationCode: z.string().min(1),
  expiresIn: z.string().optional(),
});

export const PasswordResetEmailDataSchema = BaseEmailDataSchema.extend({
  resetCode: z.string().min(1),
  expiresIn: z.string().optional(),
});

export const TwoFactorEmailDataSchema = BaseEmailDataSchema.extend({
  twoFactorCode: z.string().min(1),
  expiresIn: z.string().optional(),
});
