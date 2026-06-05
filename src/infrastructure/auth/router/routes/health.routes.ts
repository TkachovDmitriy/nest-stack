import { RouteConfig } from '../types';

/**
 * Health check routes configuration
 */
export const healthRoutes: RouteConfig[] = [
  {
    path: '/health',
    children: [
      {
        path: '/db',
        methods: {
          GET: { isPublic: true },
        },
      },
      {
        path: '/http',
        methods: {
          GET: { isPublic: true },
        },
      },
      {
        path: '/redis',
        methods: {
          GET: { isPublic: true },
        },
      },
      {
        path: '/test',
        methods: {
          GET: { isPublic: true },
        },
      },
    ],
  },
];
