// export interface AdminTokenPayload {
//   sub: string;
//   email: string;
//   role: 'admin';
//   name?: string;
//   iat: number;
//   exp: number;
//   jti: string;
//   tokenVersion: number;
// }

import { z } from 'zod';

import { AdminTokenPayloadSchema } from '@core/schemas/auth.schema';

export interface AdminTokensOutput {
  accessToken: string;
  //   refreshToken: string;
}

export type AdminTokenPayload = z.infer<typeof AdminTokenPayloadSchema>;
