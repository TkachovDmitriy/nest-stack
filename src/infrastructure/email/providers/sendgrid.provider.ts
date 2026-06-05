// import { Injectable } from '@nestjs/common';
// import * as SendGrid from '@sendgrid/mail';

// import { env } from '@infrastructure/configs/env.config';
// import { logger } from '@infrastructure/logger/logger';

// @Injectable()
// export class SendGridService {
//   constructor() {
//     SendGrid.setApiKey(env.SENDGRID_API_KEY);
//   }

//   async sendEmail(options: {
//     to: string;
//     templateId: string;
//     dynamicTemplateData: Record<string, unknown>;
//   }): Promise<void> {
//     try {
//       await SendGrid.send({
//         to: options.to,
//         from: env.SENDGRID_FROM_EMAIL,
//         templateId: options.templateId,
//         dynamicTemplateData: options.dynamicTemplateData,
//       });
//       logger.info(`Email sent to ${options.to}`);
//     } catch (error) {
//       logger.error('Failed to send email:', error);
//       throw new Error('Failed to send email');
//     }
//   }
// }
