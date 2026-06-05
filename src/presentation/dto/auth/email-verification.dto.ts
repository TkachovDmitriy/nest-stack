import { createZodDto } from 'nestjs-zod';

import {
  EmailVerificationSchema,
  EmailSuccessVerificationResponseSchema,
} from '@core/schemas/auth.schema';

export class EmailVerificationRequest extends createZodDto(
  EmailVerificationSchema.pick({ code: true }),
) {}

export class EmailVerificationResponse extends createZodDto(
  EmailSuccessVerificationResponseSchema.partial({ tokens: true }),
) {}
