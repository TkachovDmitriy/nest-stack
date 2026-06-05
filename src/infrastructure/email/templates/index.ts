import { passwordResetTemplate } from './password-reset.template';
import { twoFactorTemplate } from './two-factor.template';
import {
  BaseEmailData,
  PasswordResetEmailData,
  TwoFactorEmailData,
  VerificationEmailData,
} from './types';
import { verificationTemplate } from './verification-email.template';

export interface EmailTemplate<T extends BaseEmailData = BaseEmailData> {
  subject: string;
  html: (data: T) => string;
}

type EmailTemplateMap = {
  verificationEmail: EmailTemplate<VerificationEmailData>;
  passwordReset: EmailTemplate<PasswordResetEmailData>;
  twoFactorEnable: EmailTemplate<TwoFactorEmailData>;
};

export const emailTemplates: EmailTemplateMap = {
  verificationEmail: verificationTemplate,
  passwordReset: passwordResetTemplate,
  twoFactorEnable: twoFactorTemplate,
};

export const getEmailTemplate = <K extends keyof EmailTemplateMap>(
  templateName: K,
): EmailTemplateMap[K] => {
  return emailTemplates[templateName];
};

export * from './types';
export * from './verification-email.template';
export * from './password-reset.template';
export * from './two-factor.template';
