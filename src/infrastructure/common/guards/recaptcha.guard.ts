import { env } from 'process';

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { LoggerService } from '@infrastructure/logger/logger-service';
import { RecaptchaService } from '@infrastructure/recaptcha/recaptcha.service';

import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  private readonly logger = new LoggerService(RecaptchaGuard.name);

  constructor(
    private reflector: Reflector,
    private recaptchaService: RecaptchaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip reCAPTCHA verification in local environment
    if (env.NODE_ENV === 'local') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-recaptcha-token'];

    if (!token) {
      throw new UnauthorizedException('reCAPTCHA verification failed');
    }

    const isValid = await this.recaptchaService.verify(token);
    if (!isValid) {
      throw new UnauthorizedException('reCAPTCHA verification failed');
    }

    return true;
  }
}
