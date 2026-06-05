import { z } from 'zod';

export const EmailCodeTypeEnum = z.enum(['email', 'password']);
export type EmailCodeType = z.infer<typeof EmailCodeTypeEnum>;

export interface EmailCode {
  type: EmailCodeType;
  email: string;
  code: string;
}

export interface EmailCodeRepository {
  save(data: EmailCode): Promise<void>;
  verify(data: EmailCode): Promise<boolean>;
  delete(type: EmailCodeType, email: string): Promise<void>;
}

export interface EmailProvider {
  sendVerificationCode(to: string, name: string, code: string): Promise<void>;
  sendPasswordResetCode(to: string, name: string, code: string): Promise<void>;
}
