import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const ReCaptchaToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers['x-recaptcha-token'];

    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    return token;
  },
);
