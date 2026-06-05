import { RouteConfig } from '../types';

/**
 * Auth routes configuration
 */
export const authRoutes: RouteConfig[] = [
  {
    path: '/auth',
    methods: {
      POST: { isPublic: true }, // Default for auth endpoints
    },
    children: [
      {
        path: '/refresh',
        methods: {
          POST: { isRefreshToken: true },
        },
      },
      {
        path: '/signup',
        methods: {
          POST: { isPublic: true },
        },
      },
      {
        path: '/login',
        methods: {
          POST: { isPublic: true },
        },
      },
      {
        path: '/facebook',
        methods: {
          POST: { isPublic: true },
        },
      },
      {
        path: '/password-reset/initiate',
        methods: {
          POST: { isPublic: true },
        },
      },
      {
        path: '/password-reset/verify',
        methods: {
          POST: { isPublic: true },
        },
      },
      {
        path: '/password-reset/complete',
        methods: {
          POST: { isPublic: true },
        },
      },
      {
        path: '/2fa/verify',
        methods: {
          POST: { isTwoFactorVerify: true },
        },
      },
      {
        path: '/2fa/verify/resend-code',
        methods: {
          POST: { isTwoFactorVerify: true },
        },
      },
    ],
  },
];
