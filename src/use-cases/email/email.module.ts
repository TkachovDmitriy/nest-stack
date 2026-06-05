import { Module } from '@nestjs/common';

import { env } from '@infrastructure/configs/env.config';
import { MailchimpService } from '@infrastructure/email/providers/mailchimp.provider';
import { NodemailerMockService } from '@infrastructure/email/providers/nodemailer.mock.provider';
import { EmailService } from '@infrastructure/email/service/email.service';
import { RedisService } from '@infrastructure/redis/redis.service';

import { EmailUseCase } from './email.use-case';

import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [
    {
      provide: 'EmailProvider',
      useClass: env.NODE_ENV === 'local' ? NodemailerMockService : MailchimpService,
    },
    EmailService,
    RedisService,
    EmailUseCase,
  ],
  exports: [EmailUseCase],
})
export class EmailModule {}
