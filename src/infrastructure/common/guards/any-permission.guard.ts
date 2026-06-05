import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Permission } from '@core/interfaces/auth/permissions.interface';

import { PermissionService } from '@infrastructure/auth/permission.service';

@Injectable()
export class AnyPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Skip permission checks for public routes
    }

    const requiredPermissions = this.reflector.get<Permission[]>(
      'requireAnyPermission',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userType) {
      throw new UnauthorizedException('User role not found');
    }

    const hasPermission = this.permissionService.hasAnyPermission(
      user.userType,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new UnauthorizedException('You do not have permission to perform this action');
    }

    return true;
  }
}
