import { createZodDto } from 'nestjs-zod';

import { FacebookAuthSchema, TokensSchema } from '@core/schemas/auth.schema';

export class FacebookAuthRequest extends createZodDto(FacebookAuthSchema) {}
export class FacebookAuthResponse extends createZodDto(TokensSchema) {}
