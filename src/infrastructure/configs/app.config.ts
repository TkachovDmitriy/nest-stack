import { corsConfig } from './cors.config';
import { env } from './env.config';
import { loggerOptions } from './logger.config';
import { openApiDocument } from './swagger.config';

export const config = {
  env: env.ENV_NAME,
  logger: loggerOptions,
  swagger: openApiDocument,
  applicationName: 'Bahay',
  version: env.VERSION,
  http: {
    port: env.HTTP_PORT,
  },
  cors: corsConfig,
  api: {
    adminUser: env.API_ADMIN_USER,
    adminPassword: env.API_ADMIN_PASSWORD,
  },
} as const;

export type AppConfig = typeof config;
