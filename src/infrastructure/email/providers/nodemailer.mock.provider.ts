import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { env } from '@infrastructure/configs/env.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

import { emailTemplates } from '../templates';

@Injectable()
export class NodemailerMockService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;
  private readonly logger = new LoggerService('NodemailerMockService');

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      this.logger.info('Initializing SMTP connection...');

      this.transporter = nodemailer.createTransport({
        host: env.NODE_ENV === 'local' ? 'localhost' : 'mailserver',
        port: 25,
        secure: false,
        auth: {
          user: 'admin',
          pass: 'password',
        },
      });

      const isConnected = await this.transporter.verify();
      if (isConnected) {
        this.logger.info('SMTP connection verified successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize SMTP connection:', error);
      throw error;
    }
  }

  async sendVerificationCode(to: string, firstName: string, code: string): Promise<void> {
    const template = emailTemplates.verificationEmail;

    try {
      this.logger.info(`Sending verification email to ${to}`);

      const info = await this.transporter.sendMail({
        from: '"Development Team" <dev@example.com>',
        to,
        subject: template.subject,
        html: template.html({
          firstName,
          verificationCode: code,
          expiresIn: '10',
          logoUrl: '',
          websiteUrl: '',
          supportEmail: '',
        }),
      });

      this.logger.info('Email sent, message ID:', info.messageId);
    } catch (error) {
      this.logger.error('Failed to send verification email:', error);
      throw new Error(`Failed to send verification email: ${error}`);
    }
  }

  async sendPasswordResetCode(to: string, firstName: string, code: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: '"Development Team" <dev@example.com>',
        to,
        subject: 'Password Reset Code',
        text: `Hello ${firstName}! Your password reset code is: ${code}`,
      });

      this.logger.info('Email sent, message ID:', info.messageId);
    } catch (error) {
      this.logger.error('Failed to send password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error}`);
    }
  }

  async send2FAEnableCode(to: string, firstName: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: '"Development Team" <dev@example.com>',
        to,
        subject: 'Enable 2FA',
        text: `Hello ${firstName}! Your 2FA enable code is: ${code}`,
      });

      this.logger.info(`2FA enable email sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send 2FA enable email:', error);
      throw new Error(`Failed to send 2FA enable email: ${error}`);
    }
  }
}
