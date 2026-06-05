import { SetMetadata } from '@nestjs/common';

import {
  Permission,
  PermissionGroup,
  PERMISSION_GROUPS,
} from '@core/interfaces/auth/permissions.interface';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Require specific permissions to access a resource
 * @param permissions - The permissions required
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Require all permissions from a specific permission group
 * @param group - The permission group
 */
export const RequirePermissionGroup = (group: PermissionGroup) => {
  const permissions = PERMISSION_GROUPS[group] || [];
  return SetMetadata(PERMISSIONS_KEY, permissions);
};

/**
 * Require any of the specified permissions to access a resource
 * This is a more flexible alternative to RequirePermissions
 * The implementation requires a custom guard
 */
export const RequireAnyPermission = (...permissions: Permission[]) =>
  SetMetadata('requireAnyPermission', permissions);
