import { Injectable } from '@nestjs/common';

import {
  Permission,
  PermissionGroup,
  PERMISSION_GROUPS,
} from '@core/interfaces/auth/permissions.interface';

/**
 * Interface for route permission definition
 */
export interface RoutePermission {
  path: string;
  method: string;
  permissions?: Permission[];
  permissionGroup?: PermissionGroup;
  requireAll?: boolean;
  isPublic?: boolean;
  isAdmin?: boolean;
  isRefreshToken?: boolean;
  isTwoFactorVerify?: boolean;
}

/**
 * Registry for managing route permissions in a centralized way
 */
@Injectable()
export class RoutePermissionsRegistry {
  private routePermissions: Map<string, RoutePermission> = new Map();
  private pathPatterns: Map<string, RegExp> = new Map();

  /**
   * Register a route permission
   * @param routePermission The route permission to register
   */
  register(routePermission: RoutePermission): void {
    const key = this.getRouteKey(routePermission.path, routePermission.method);
    this.routePermissions.set(key, routePermission);

    // If the path contains parameters, create a regex pattern for it
    if (routePermission.path.includes(':')) {
      this.pathPatterns.set(key, this.pathToRegex(routePermission.path));
    }
  }

  /**
   * Register multiple route permissions
   * @param routePermissions Array of route permissions to register
   */
  registerMany(routePermissions: RoutePermission[]): void {
    routePermissions.forEach((permission) => this.register(permission));
  }

  /**
   * Get permissions for a specific route
   * @param path Route path
   * @param method HTTP method
   * @returns Route permission definition or undefined if not found
   */
  getRoutePermission(path: string, method: string): RoutePermission | undefined {
    // Try exact match first
    const exactKey = this.getRouteKey(path, method);
    const exactMatch = this.routePermissions.get(exactKey);

    if (exactMatch) {
      return exactMatch;
    }

    // Try pattern matching for paths with parameters
    const methodPrefix = `${method.toUpperCase()}:`;
    for (const [key, pattern] of this.pathPatterns.entries()) {
      if (key.startsWith(methodPrefix) && pattern.test(path)) {
        return this.routePermissions.get(key);
      }
    }

    // Try exact match with 'ALL' method
    const allKey = this.getRouteKey(path, 'ALL');
    const allMatch = this.routePermissions.get(allKey);
    if (allMatch) {
      return allMatch;
    }
    // Try pattern matching with 'ALL' method
    const allPrefix = `ALL:`;
    for (const [key, pattern] of this.pathPatterns.entries()) {
      if (key.startsWith(allPrefix) && pattern.test(path)) {
        return this.routePermissions.get(key);
      }
    }

    return undefined;
  }

  /**
   * Check if a route is public
   * @param path Route path
   * @param method HTTP method
   * @returns Boolean indicating if the route is public
   */
  isRoutePublic(path: string, method: string): boolean {
    const permission = this.getRoutePermission(path, method);
    return permission?.isPublic || false;
  }

  /**
   * Check if a route is an admin route
   * @param path Route path
   * @param method HTTP method
   * @returns Boolean indicating if the route is an admin route
   */
  isAdminRoute(path: string, method: string): boolean {
    const permission = this.getRoutePermission(path, method);
    return permission?.isAdmin || false;
  }

  /**
   * Check if a route is a refresh token route
   * @param path Route path
   * @param method HTTP method
   * @returns Boolean indicating if the route is a refresh token route
   */
  isRefreshTokenRoute(path: string, method: string): boolean {
    const permission = this.getRoutePermission(path, method);
    return permission?.isRefreshToken || false;
  }

  /**
   * Check if a route is a two-factor verification route
   * @param path Route path
   * @param method HTTP method
   * @returns Boolean indicating if the route is a two-factor verification route
   */
  isTwoFactorVerifyRoute(path: string, method: string): boolean {
    const permission = this.getRoutePermission(path, method);
    return permission?.isTwoFactorVerify || false;
  }

  /**
   * Get required permissions for a route
   * @param path Route path
   * @param method HTTP method
   * @returns Array of required permissions
   */
  getRequiredPermissions(path: string, method: string): Permission[] {
    const permission = this.getRoutePermission(path, method);

    if (!permission) {
      return [];
    }

    if (permission.permissions) {
      return permission.permissions;
    }

    if (permission.permissionGroup) {
      return PERMISSION_GROUPS[permission.permissionGroup] || [];
    }

    return [];
  }

  /**
   * Check if a route requires all permissions or any permission
   * @param path Route path
   * @param method HTTP method
   * @returns Boolean indicating if all permissions are required
   */
  requiresAllPermissions(path: string, method: string): boolean {
    const permission = this.getRoutePermission(path, method);
    return permission?.requireAll !== false; // Default to true if not specified
  }

  /**
   * Generate a unique key for a route
   * @param path Route path
   * @param method HTTP method
   * @returns Unique route key
   */
  private getRouteKey(path: string, method: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  /**
   * Convert a path pattern with parameters to a RegExp
   * @param path Path pattern with parameters (e.g., '/users/:id')
   * @returns RegExp that matches the path pattern
   */
  private pathToRegex(path: string): RegExp {
    // Replace path parameters with regex patterns
    // e.g., '/users/:id' becomes '/users/([^/]+)'
    const regexPath = path.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/');

    return new RegExp(`^${regexPath}$`);
  }
}
