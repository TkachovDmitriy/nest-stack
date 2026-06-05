import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { TokenService } from '@auth/token.service';

import {
  IS_ADMIN_KEY,
  IS_PUBLIC_KEY,
  IS_PUBLIC_WITH_USER_KEY,
  IS_TWO_FACTOR_VERIFY_KEY,
} from '@common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const isPublicWithUser = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_WITH_USER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isTwoFactorVerify = this.reflector.getAllAndOverride<boolean>(IS_TWO_FACTOR_VERIFY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // If it's a public route with optional user and no token is provided, allow access
    if (isPublicWithUser && !token) {
      return true;
    }

    // For non-public routes or public routes with user info when token is provided
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenService.verifyToken(token);

      if (!isTwoFactorVerify && payload.twoFactorEnabled && !payload.twoFactorVerified) {
        throw new UnauthorizedException('Two-factor authentication required');
      }

      request['user'] = payload;
      return true;
    } catch (_) {
      // If it's a public route with optional user and token verification failed,
      // still allow access but without user info
      if (isPublicWithUser) {
        return true;
      }
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
