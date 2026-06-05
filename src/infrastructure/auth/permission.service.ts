import { Injectable } from '@nestjs/common';

import {
  Permission,
  ROLE_PERMISSIONS,
  PermissionGroup,
  PERMISSION_GROUPS,
} from '@core/interfaces/auth/permissions.interface';
import { UserType } from '@core/schemas/user.schema';

@Injectable()
export class PermissionService {
  private permissionCache = new Map<string, boolean>();

  /**
   * Check if a user has a specific permission
   * @param userType - The user's role/type
   * @param permission - The permission to check
   * @returns boolean - Whether the user has the permission
   */
  hasPermission(userType: UserType, permission: Permission): boolean {
    const cacheKey = `${userType}:${permission}`;

    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    const userPermissions = ROLE_PERMISSIONS[userType] || [];
    const hasPermission = userPermissions.includes(permission);

    // Cache the result for future checks
    this.permissionCache.set(cacheKey, hasPermission);

    return hasPermission;
  }

  /**
   * Check if a user has all of the specified permissions
   * @param userType - The user's role/type
   * @param permissions - The permissions to check
   * @returns boolean - Whether the user has all permissions
   */
  hasAllPermissions(userType: UserType, permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(userType, permission));
  }

  /**
   * Check if a user has any of the specified permissions
   * @param userType - The user's role/type
   * @param permissions - The permissions to check
   * @returns boolean - Whether the user has any of the permissions
   */
  hasAnyPermission(userType: UserType, permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(userType, permission));
  }

  /**
   * Get all permissions for a specific group
   * @param group - The permission group
   * @returns Permission[] - Array of permissions in the group
   */
  getPermissionsInGroup(group: PermissionGroup): Permission[] {
    return PERMISSION_GROUPS[group] || [];
  }

  /**
   * Get all permissions for a user type
   * @param userType - The user's role/type
   * @returns Permission[] - Array of permissions for the user
   */
  getUserPermissions(userType: UserType): Permission[] {
    return ROLE_PERMISSIONS[userType] || [];
  }

  /**
   * Clear the permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }
}
