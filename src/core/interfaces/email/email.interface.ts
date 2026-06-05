import { EmailCodeType } from '@core/types/email.types';

export interface IEmailService {
  sendVerificationCode(to: string, code: string): Promise<void>;
  verifyCode(email: string, code: string, type: EmailCodeType): Promise<boolean>;
  deleteCode(email: string, type: EmailCodeType): Promise<void>;
}
