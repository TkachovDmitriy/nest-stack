import { createZodDto } from 'nestjs-zod';

import {
  CompletePasswordResetSchema,
  EmailSuccessVerificationResponseSchema,
  InitiatePasswordResetRequestSchema,
  VerifyPasswordResetCodeSchema,
} from '@core/schemas/auth.schema';

export class PasswordResetInitiateRequest extends createZodDto(
  InitiatePasswordResetRequestSchema,
) {}
export class PasswordResetVerifyRequest extends createZodDto(VerifyPasswordResetCodeSchema) {}
export class PasswordResetCompleteRequest extends createZodDto(CompletePasswordResetSchema) {}
export class PasswordResetResponse extends createZodDto(
  EmailSuccessVerificationResponseSchema.omit({ tokens: true }),
) {}
