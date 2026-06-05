import * as mailchimp from '@mailchimp/mailchimp_transactional';
import { Injectable } from '@nestjs/common';

import { env } from '@infrastructure/configs/env.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

import { emailTemplates } from '../templates';

@Injectable()
export class MailchimpService {
  private readonly client: mailchimp.ApiClient;
  private readonly logger = new LoggerService('MailchimpService');
  private logoUrl: string;
  private websiteUrl: string;
  private supportEmail: string;

  constructor() {
    this.client = mailchimp(env.MAILCHIMP_API_KEY);
    this.logoUrl = '';
    this.websiteUrl = env.APP_URL;
    this.supportEmail = env.MAILCHIMP_FROM_EMAIL;
  }

  async sendVerificationCode(to: string, firstName: string, code: string): Promise<void> {
    const template = emailTemplates.verificationEmail;

    try {
      await this.client.messages.sendTemplate({
        template_name: env.MAILCHIMP_BASE_TEMPLATE,
        template_content: [],
        message: {
          to: [{ email: to }],
          from_email: env.MAILCHIMP_FROM_EMAIL,
          from_name: env.MAILCHIMP_FROM_NAME,
          html: template.html({
            firstName,
            verificationCode: code,
            expiresIn: '5',
            logoUrl: this.logoUrl,
            websiteUrl: this.websiteUrl,
            supportEmail: this.supportEmail,
          }),
          subject: template.subject,
        },
      });
      this.logger.info(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetCode(to: string, firstName: string, code: string): Promise<void> {
    const template = emailTemplates.passwordReset;

    try {
      await this.client.messages.sendTemplate({
        template_name: env.MAILCHIMP_BASE_TEMPLATE,
        template_content: [],
        message: {
          to: [{ email: to }],
          from_email: env.MAILCHIMP_FROM_EMAIL,
          from_name: env.MAILCHIMP_FROM_NAME,
          html: template.html({
            firstName,
            resetCode: code,
            expiresIn: '5',
            logoUrl: this.logoUrl,
            websiteUrl: this.websiteUrl,
            supportEmail: this.supportEmail,
          }),
          subject: template.subject,
        },
      });
      this.logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to process password reset request');
    }
  }

  async send2FAEnableCode(to: string, firstName: string, code: string): Promise<void> {
    const template = emailTemplates.twoFactorEnable;

    await this.client.messages.sendTemplate({
      template_name: env.MAILCHIMP_BASE_TEMPLATE,
      template_content: [],
      message: {
        to: [{ email: to }],
        from_email: env.MAILCHIMP_FROM_EMAIL,
        from_name: env.MAILCHIMP_FROM_NAME,
        html: template.html({
          firstName,
          twoFactorCode: code,
          expiresIn: '5',
          logoUrl: this.logoUrl,
          websiteUrl: this.websiteUrl,
          supportEmail: this.supportEmail,
        }),
        subject: template.subject,
      },
    });
  }
}
