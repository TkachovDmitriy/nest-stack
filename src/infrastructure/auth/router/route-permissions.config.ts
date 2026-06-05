import { RoutePermission } from './route-permissions.registry';
import { authRoutes, healthRoutes } from './routes';
import { RouteConfig } from './types';

function flattenRoutes(routeConfigs: RouteConfig[], basePath: string = ''): RoutePermission[] {
  const result: RoutePermission[] = [];

  for (const config of routeConfigs) {
    const fullPath = basePath + config.path;

    if (config.methods) {
      for (const [method, permissionConfig] of Object.entries(config.methods)) {
        result.push({
          path: fullPath,
          method,
          ...permissionConfig,
        });
      }
    }

    if (config.children && config.children.length > 0) {
      result.push(...flattenRoutes(config.children, fullPath));
    }
  }

  return result;
}

const allRoutes: RouteConfig[] = [...authRoutes, ...healthRoutes];

export const routePermissionsConfig: RoutePermission[] = flattenRoutes(allRoutes);
