import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { TokenPayload } from '@core/interfaces/auth/token.interface';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    if (user.twoFactorEnabled) {
      throw new UnauthorizedException('Two-factor authentication required');
    }

    return true;
  }
}
