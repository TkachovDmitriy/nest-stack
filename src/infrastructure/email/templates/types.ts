import { z } from 'zod';

import {
  BaseEmailDataSchema,
  VerificationEmailDataSchema,
  PasswordResetEmailDataSchema,
  TwoFactorEmailDataSchema,
} from '@core/schemas/email.schema';

export type BaseEmailData = z.infer<typeof BaseEmailDataSchema>;
export type VerificationEmailData = z.infer<typeof VerificationEmailDataSchema>;
export type PasswordResetEmailData = z.infer<typeof PasswordResetEmailDataSchema>;
export type TwoFactorEmailData = z.infer<typeof TwoFactorEmailDataSchema>;
