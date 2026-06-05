import { createZodDto } from 'nestjs-zod';

import { RefreshTokenSchema, TokensSchema } from '@core/schemas/auth.schema';

export class TokenRefreshRequest extends createZodDto(RefreshTokenSchema) {}
export class TokensResponse extends createZodDto(TokensSchema) {}
