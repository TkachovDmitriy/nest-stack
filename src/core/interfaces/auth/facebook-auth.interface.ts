import { z } from 'zod';

import { FacebookAuthSchema, TokensSchema } from '@core/schemas/auth.schema';
import { UserSocialAuthSchema } from '@core/schemas/user.schema';

export type UserSocialAuthOutput = z.infer<typeof UserSocialAuthSchema>;

export type FacebookAuthInput = z.infer<typeof FacebookAuthSchema>;
export type FacebookAuthOutput = z.infer<typeof TokensSchema>;

export enum Provider {
  LOCAL = 'local',
  FACEBOOK = 'facebook',
}
