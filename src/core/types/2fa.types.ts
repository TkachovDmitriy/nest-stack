import { z } from 'zod';

export const TwoFactorCodeTypeEnum = z.enum(['twoFactor', 'twoFactorEnable']);
export type TwoFactorCodeType = z.infer<typeof TwoFactorCodeTypeEnum>;

export interface TwoFactorCode {
  type: TwoFactorCodeType;
  userId: string;
  code: string;
}
