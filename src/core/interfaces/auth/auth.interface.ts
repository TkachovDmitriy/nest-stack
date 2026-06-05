import { z } from 'zod';

import * as schema from '@core/schemas/auth.schema';

import { TokensOutput } from './token.interface';

export type LoginInput = z.infer<typeof schema.LoginSchema>;
export type EmailVerificationInput = z.infer<typeof schema.EmailVerificationSchema>;
export type EmailVerificationOutput = z.infer<typeof schema.EmailVerificationResponseSchema>;
export type EmailVerificationSuccessOutput = z.infer<
  typeof schema.EmailSuccessVerificationResponseSchema
>;
export type RefreshTokenInput = z.infer<typeof schema.RefreshTokenSchema>;
export type PasswordResetInitiateInput = z.infer<typeof schema.InitiatePasswordResetRequestSchema>;
export type PasswordResetVerifyInput = z.infer<typeof schema.VerifyPasswordResetCodeSchema>;
export type PasswordResetCompleteInput = z.infer<typeof schema.CompletePasswordResetSchema>;

export interface IAuthService {
  login(data: LoginInput): Promise<TokensOutput>;
  verifyEmail(data: EmailVerificationInput): Promise<boolean>;
  refreshTokens(token: string): Promise<TokensOutput>;
}
