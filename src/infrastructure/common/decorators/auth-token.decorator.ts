import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { TokenPayload } from '@core/interfaces/auth/token.interface';

import { LoggerService } from '@infrastructure/logger/logger-service';

export const AuthToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest();

    // Check if Authorization header exists
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // Verify Bearer token format
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      // Assuming the token is already verified by your JWT guard
      const tokenPayload = request.user as TokenPayload;
      if (!tokenPayload) {
        throw new UnauthorizedException('Token payload is missing');
      }

      return token;
    } catch (error) {
      throw new UnauthorizedException('Invalid token payload');
    }
  },
);
