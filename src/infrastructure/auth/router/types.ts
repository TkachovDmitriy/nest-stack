import { RoutePermission } from './route-permissions.registry';

/**
 * Interface for nested route configuration
 */
export interface RouteConfig {
  path: string;
  methods?: {
    [method: string]: Omit<RoutePermission, 'path' | 'method'>;
  };
  children?: RouteConfig[];
}
