import {
  BaseEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  TwoFactorEmailData,
} from './types';

type EmailType = 'verification' | 'passwordReset' | 'twoFactor';

export const validateEmailData = (type: EmailType, data: BaseEmailData) => {
  if (!data.firstName) {
    throw new Error('firstName is required');
  }

  switch (type) {
    case 'verification':
      const verificationData = data as VerificationEmailData;
      if (!verificationData.verificationCode) {
        throw new Error('verificationCode is required');
      }
      if (verificationData.verificationCode.length !== 6) {
        throw new Error('verificationCode must be 6 digits');
      }
      break;

    case 'passwordReset':
      const passwordResetData = data as PasswordResetEmailData;
      if (!passwordResetData.resetCode) {
        throw new Error('resetCode is required');
      }
      if (passwordResetData.resetCode.length !== 6) {
        throw new Error('resetCode must be 6 digits');
      }
      break;

    case 'twoFactor':
      const twoFactorData = data as TwoFactorEmailData;
      if (!twoFactorData.twoFactorCode) {
        throw new Error('twoFactorCode is required');
      }
      if (twoFactorData.twoFactorCode.length !== 6) {
        throw new Error('twoFactorCode must be 6 digits');
      }
      break;
  }

  return data;
};
