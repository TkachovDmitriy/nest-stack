import { Injectable, BadRequestException } from '@nestjs/common';

import { RecaptchaResponseSchema } from '@core/schemas/recaptcha.schema';

import { env } from '@infrastructure/configs/env.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

@Injectable()
export class RecaptchaService {
  private readonly logger = new LoggerService(RecaptchaService.name);
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

  async verify(token: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        secret: env.RECAPTCHA_SECRET_KEY,
        response: token,
      });

      const response = await fetch(`${this.verifyUrl}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`reCAPTCHA verification failed: ${response.statusText}`);
      }

      const data = RecaptchaResponseSchema.parse(await response.json());

      if (!data.success) {
        return false;
      }

      return true;
    } catch (error) {
      throw new BadRequestException('Failed to verify reCAPTCHA');
    }
  }
}
