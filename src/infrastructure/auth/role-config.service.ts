import { Injectable } from '@nestjs/common';

import { Permission, ROLE_PERMISSIONS } from '@core/interfaces/auth/permissions.interface';
import { UserType } from '@core/schemas/user.schema';

/**************
 * This service is not used from now, but it's here for future reference
 * Service for dynamically managing role configurations
 * This allows for runtime updates to permissions without code changes
 **************/
@Injectable()
export class RoleConfigService {
  private rolePermissions: Map<UserType, Set<Permission>> = new Map();

  constructor() {
    // Initialize with default permissions from the static configuration
    this.initializeDefaultPermissions();
  }

  private initializeDefaultPermissions(): void {
    // Load the static permissions as a starting point
    Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      const userType = role as UserType;
      const permissionSet = new Set<Permission>(permissions);
      this.rolePermissions.set(userType, permissionSet);
    });
  }

  /**
   * Get all permissions for a user type
   * @param userType - The user's role/type
   * @returns Permission[] - Array of permissions for the user
   */
  getPermissionsForRole(userType: UserType): Permission[] {
    // First check dynamic permissions
    const dynamicPermissions = this.rolePermissions.get(userType);

    // If we have dynamic permissions for this role, return those
    if (dynamicPermissions) {
      return Array.from(dynamicPermissions);
    }

    // Otherwise fall back to static permissions
    return ROLE_PERMISSIONS[userType] || [];
  }

  /**
   * Add a permission to a role
   * @param userType - The role to add the permission to
   * @param permission - The permission to add
   */
  addPermissionToRole(userType: UserType, permission: Permission): void {
    if (!this.rolePermissions.has(userType)) {
      // Start with static permissions if available
      const staticPermissions = ROLE_PERMISSIONS[userType] || [];
      this.rolePermissions.set(userType, new Set(staticPermissions));
    }
    this.rolePermissions.get(userType)!.add(permission);
  }

  /**
   * Remove a permission from a role
   * @param userType - The role to remove the permission from
   * @param permission - The permission to remove
   */
  removePermissionFromRole(userType: UserType, permission: Permission): void {
    if (this.rolePermissions.has(userType)) {
      this.rolePermissions.get(userType)!.delete(permission);
    } else {
      // If we don't have dynamic permissions yet, create from static minus the one to remove
      const staticPermissions = ROLE_PERMISSIONS[userType] || [];
      const filteredPermissions = staticPermissions.filter((p) => p !== permission);
      this.rolePermissions.set(userType, new Set(filteredPermissions));
    }
  }

  /**
   * Check if a role has a specific permission
   * @param userType - The role to check
   * @param permission - The permission to check for
   * @returns boolean - Whether the role has the permission
   */
  hasPermission(userType: UserType, permission: Permission): boolean {
    // First check dynamic permissions
    const dynamicPermissions = this.rolePermissions.get(userType);
    if (dynamicPermissions) {
      return dynamicPermissions.has(permission);
    }

    // Fall back to static permissions
    const staticPermissions = ROLE_PERMISSIONS[userType] || [];
    return staticPermissions.includes(permission);
  }

  /**
   * Reset permissions for a role to the static defaults
   * @param userType - The role to reset
   */
  resetRoleToDefault(userType: UserType): void {
    const staticPermissions = ROLE_PERMISSIONS[userType] || [];
    if (staticPermissions.length > 0) {
      this.rolePermissions.set(userType, new Set(staticPermissions));
    } else {
      this.rolePermissions.delete(userType);
    }
  }

  /**
   * Reset all roles to their static defaults
   */
  resetAllRolesToDefault(): void {
    this.rolePermissions.clear();
    this.initializeDefaultPermissions();
  }
}
