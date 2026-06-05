import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { LoggerService } from '@infrastructure/logger/logger-service';

import { TokenService } from '@auth/token.service';

import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly logger = new LoggerService(RefreshTokenGuard.name);

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

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const payload = await this.tokenService.verifyToken(token, true);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
