import { z } from 'zod';

const isDevelopment = process.env.NODE_ENV === 'development';

export const envSchema = z.object({
  // Environment
  ENV_NAME: z.string().default('development'),
  VERSION: z.string().default('latest'),
  HTTP_PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.string().default('development'),
  PORT: z.string().transform(Number),
  APP_URL: z.string(),
  ADMIN_URL: z.string().optional(),
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  PRETTY_LOGGING: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  // Admin user and password for API
  API_ADMIN_USER: z.string().default('admin'),
  API_ADMIN_PASSWORD: z.string().default('password'),
  // CORS
  CORS_ORIGIN: z.string().or(z.array(z.string())).default('http://localhost:3000'),
  // Database
  DATABASE_URL: z.string(),
  // AWS
  AWS_ACCESS_KEY_ID: isDevelopment ? z.string() : z.string().optional(),
  AWS_SECRET_ACCESS_KEY: isDevelopment ? z.string() : z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  // Mailchimp
  MAILCHIMP_API_KEY: z.string(),
  MAILCHIMP_FROM_EMAIL: z.string(),
  MAILCHIMP_FROM_NAME: z.string(),
  MAILCHIMP_BASE_TEMPLATE: z.string(),
  // Redis
  REDIS_URL: z.string(),
  // reCAPTCHA
  RECAPTCHA_SECRET_KEY: z.string().min(1),
  RECAPTCHA_SITE_KEY: z.string().min(1),
  // Elasticsearch
  ELASTIC_ENTERPRISE_SEARCH_API_KEY: z.string(),
  ELASTIC_ENTERPRISE_SEARCH_BASE_URL: z.string(),
  ELASTIC_ENTERPRISE_SEARCH_ENGINE_NAME: z.string(),
  // New Elasticsearch
  ELASTICSEARCH_CLOUD_ID: z.string(),
  ELASTICSEARCH_API_KEY: z.string(),
  ELASTICSEARCH_INDEX_NAME: z.string().default('listings'),
  ELASTICSEARCH_NODE: z.string(),
  // Feature Flags
  ENABLE_NEW_ELASTICSEARCH: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  // Sentry
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z
    .string()
    .transform(Number)
    .default(process.env.NODE_ENV === 'production' ? '0.01' : '0'),
  SENTRY_PROFILES_SAMPLE_RATE: z
    .string()
    .transform(Number)
    .default(process.env.NODE_ENV === 'production' ? '0.005' : '0'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Parse environment variables for all environments
// Test environment setup should ensure all required vars are set
export const env = envSchema.parse(process.env);
