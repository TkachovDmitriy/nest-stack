import { Inject, Injectable } from '@nestjs/common';

import { MailchimpService } from '@infrastructure/email/providers/mailchimp.provider';
import { NodemailerMockService } from '@infrastructure/email/providers/nodemailer.mock.provider';
import { EmailService } from '@infrastructure/email/service/email.service';
import { LoggerService } from '@infrastructure/logger/logger-service';

import { UserUseCase } from '../user/user.use-case';

@Injectable()
export class EmailUseCase {
  private readonly logger = new LoggerService(EmailUseCase.name);

  constructor(
    @Inject('EmailProvider')
    private readonly emailProvider: MailchimpService | NodemailerMockService,
    private readonly emailService: EmailService,
    private readonly userUseCase: UserUseCase,
  ) {}

  async sendVerificationEmail(to: string): Promise<void> {
    try {
      const code = await this.emailService.generateCode('email', to);
      await this.emailProvider.sendVerificationCode(to, to, code);
      this.logger.info(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send verification email', { error });
      throw new Error('Failed to send verification email');
    }
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const isValidCode = await this.emailService.verifyCode('email', email, code);
    if (!isValidCode) return false;

    const user = await this.userUseCase.findByEmail(email);
    if (!user || user.isEmailVerified) return false;

    await this.userUseCase.updateUser(user.id, { isEmailVerified: true });
    return true;
  }

  async sendPasswordResetEmail(to: string, firstName: string): Promise<void> {
    const code = await this.emailService.generateCode('password', to);
    await this.emailProvider.sendPasswordResetCode(to, firstName, code);
    this.logger.info(`Password reset email sent to ${to}`);
  }

  async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    return this.emailService.verifyCode('password', email, code);
  }

  async send2FAEnableCode(to: string, firstName: string, code: string): Promise<void> {
    await this.emailProvider.send2FAEnableCode(to, firstName, code);
    this.logger.info(`2FA enable email sent to ${to}`);
  }
}
