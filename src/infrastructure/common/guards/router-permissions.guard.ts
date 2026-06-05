import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { PermissionService } from '@infrastructure/auth/permission.service';
import { LoggerService } from '@infrastructure/logger/logger-service';

import { RoutePermissionsRegistry } from '@auth/router/route-permissions.registry';
import { TokenService } from '@auth/token.service';

import {
  IS_ADMIN_KEY,
  IS_PUBLIC_KEY,
  IS_REFRESH_TOKEN_KEY,
  IS_TWO_FACTOR_VERIFY_KEY,
} from '@common/decorators/public.decorator';

/**
 * Comprehensive guard that handles JWT authentication and authorization
 */
@Injectable()
export class RouterPermissionsGuard implements CanActivate {
  private readonly logger = new LoggerService(RouterPermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private routePermissionsRegistry: RoutePermissionsRegistry,
    private permissionService: PermissionService,
    private tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { path, method } = request;

    // Check if route is marked as public via decorator
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || this.routePermissionsRegistry.isRoutePublic(path, method);

    if (isPublic) {
      return true;
    }

    // Skip validation for admin routes - they'll be handled by AdminAuthGuard
    const isAdmin =
      this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || this.routePermissionsRegistry.isAdminRoute(path, method);

    if (isAdmin) {
      return true;
    }

    // Skip validation for refresh token routes - they'll be handled by RefreshTokenGuard
    const isRefreshToken =
      this.reflector.getAllAndOverride<boolean>(IS_REFRESH_TOKEN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || this.routePermissionsRegistry.isRefreshTokenRoute(path, method);

    if (isRefreshToken) {
      return true;
    }

    // Check if this is a two-factor verification route
    const isTwoFactorVerify =
      this.reflector.getAllAndOverride<boolean>(IS_TWO_FACTOR_VERIFY_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || this.routePermissionsRegistry.isTwoFactorVerifyRoute(path, method);

    // Extract token from header
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      // Regular JWT authentication
      const payload = await this.tokenService.verifyToken(token);

      // Check two-factor authentication if required
      if (!isTwoFactorVerify && payload.twoFactorEnabled && !payload.twoFactorVerified) {
        throw new UnauthorizedException('Two-factor authentication required');
      }

      // Set user in request
      request.user = payload;
    } catch (_error) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    // Get required permissions from the registry
    const requiredPermissions = this.routePermissionsRegistry.getRequiredPermissions(path, method);

    // If no permissions required, proceed with authentication only
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Check user authentication
    const { user } = request;
    if (!user || !user.userType) {
      throw new UnauthorizedException('User role not found');
    }

    // Check if user has required permissions
    const requireAll = this.routePermissionsRegistry.requiresAllPermissions(path, method);

    let hasPermission = false;

    if (requireAll) {
      hasPermission = this.permissionService.hasAllPermissions(user.userType, requiredPermissions);
    } else {
      hasPermission = this.permissionService.hasAnyPermission(user.userType, requiredPermissions);
    }

    if (!hasPermission) {
      throw new UnauthorizedException('You do not have permission to perform this action');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
