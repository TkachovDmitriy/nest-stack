import { z } from 'zod';

import { TokenPayloadSchema, TokensSchema } from '@core/schemas/auth.schema';

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type TokensOutput = z.infer<typeof TokensSchema>;

export interface ITokenService {
  generateTokens(payload: TokenPayload): TokensOutput;
  verifyToken(token: string): TokenPayload;
  refreshToken(token: string): TokensOutput;
}
