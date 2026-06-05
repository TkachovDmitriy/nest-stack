import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserType } from '@core/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserType[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userType) {
      throw new UnauthorizedException('User role not found');
    }

    const hasRole = requiredRoles.includes(user.userType);
    if (!hasRole) {
      throw new UnauthorizedException('You do not have permission to perform this action');
    }

    return true;
  }
}
