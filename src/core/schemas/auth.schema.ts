import { z } from 'zod';

import { UserType } from './user.schema';

export const TokenPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  iat: z.number(),
  exp: z.number(),
  jti: z.string(),
  mfaVerified: z.boolean().optional(),
  tokenVersion: z.number().optional(),
  isEmailVerified: z.boolean().optional(),
  avatar: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userType: z.string().optional(),
  twoFactorEnabled: z.boolean().default(false).optional(),
  twoFactorVerified: z.boolean().default(false).optional(),
  provider: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().default('test@example.com').describe('Email'),
  password: z.string().min(8).max(100).default('password').describe('Password'),
});

export const TokensSchema = z.object({
  accessToken: z.string().describe('Access token'),
  refreshToken: z.string().describe('Refresh token'),
});

export const EmailVerificationSchema = z.object({
  code: z.string().length(6),
  email: z.string().email(),
  id: z.string(),
});

export const EmailVerificationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  resetToken: z.string().optional(),
});

export const EmailSuccessVerificationResponseSchema = EmailVerificationResponseSchema.extend({
  tokens: TokensSchema,
});

export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string({
      required_error: 'Refresh token is required',
    })
    .min(1, 'Refresh token cannot be empty'),
});

export const InitiatePasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const VerifyPasswordResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const CompletePasswordResetSchema = z
  .object({
    resetToken: z.string(),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const FacebookAuthSchema = z.object({
  accessToken: z.string().min(1, 'Facebook access token is required'),
});

export const AdminTokenPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.literal('admin'),
  name: z.string().optional(),
  iat: z.number(),
  exp: z.number(),
  jti: z.string(),
  tokenVersion: z.number(),
});

export const AdminLoginSchema = LoginSchema.extend({
  role: z.literal('admin'),
});

export const Confirm2FASchema = z.object({
  code: z.string().length(6),
});

export const Disable2FASchema = LoginSchema.pick({ password: true });

export const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(UserType),
});
