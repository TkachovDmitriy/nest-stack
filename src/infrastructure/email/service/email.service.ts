import { Injectable, BadRequestException } from '@nestjs/common';

import { EmailCodeType } from '@core/types/email.types';

import { LoggerService } from '@infrastructure/logger/logger-service';
import { RedisService } from '@infrastructure/redis/redis.service';

import { generateNumericCode } from '@common/utils/code-generator';

@Injectable()
export class EmailService {
  private readonly logger = new LoggerService(EmailService.name);
  private readonly errorMessages = {
    email: 'Verification code expired or not found',
    password: 'Reset code expired or not found',
  } as const;

  constructor(private readonly redisService: RedisService) {}

  async generateCode(type: EmailCodeType, email: string): Promise<string> {
    try {
      const code = generateNumericCode();
      await this.redisService.save({ type, email, code });
      return code;
    } catch (error) {
      throw new BadRequestException(`Failed to generate ${type} code`);
    }
  }

  async verifyCode(type: EmailCodeType, email: string, code: string): Promise<boolean> {
    try {
      const isValid = await this.redisService.verify({ type, email, code });
      if (!isValid) {
        throw new BadRequestException(this.errorMessages[type]);
      }
      return true;
    } catch (error) {
      throw new BadRequestException(this.errorMessages[type]);
    }
  }
}
