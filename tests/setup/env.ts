/**
 * Test Environment Setup - DRY Solution
 * Single source of truth for test environment variables
 */

// Define test environment variables once
const TEST_ENV_VARS = {
  ENV_NAME: 'test',
  VERSION: 'test',
  HTTP_PORT: '3000',
  NODE_ENV: 'test',
  PORT: '3000',
  APP_URL: 'http://localhost:3000',
  ADMIN_URL: 'http://localhost:3001',
  LOG_LEVEL: 'error',
  PRETTY_LOGGING: 'false',
  API_ADMIN_USER: 'admin',
  API_ADMIN_PASSWORD: 'password',
  CORS_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  AWS_ACCESS_KEY_ID: 'test-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret',
  AWS_REGION: 'us-east-1',
  AWS_BUCKET_NAME: 'test-bucket',
  MAILCHIMP_API_KEY: 'test-api-key',
  MAILCHIMP_FROM_EMAIL: 'test@example.com',
  MAILCHIMP_FROM_NAME: 'Test Sender',
  MAILCHIMP_BASE_TEMPLATE: 'test-template',
  REDIS_URL: 'redis://localhost:6379',
  RECAPTCHA_SECRET_KEY: 'test-secret-key',
  RECAPTCHA_SITE_KEY: 'test-site-key',
  ELASTIC_ENTERPRISE_SEARCH_API_KEY: 'test-elastic-key',
  ELASTIC_ENTERPRISE_SEARCH_BASE_URL: 'http://localhost:9200',
  ELASTIC_ENTERPRISE_SEARCH_ENGINE_NAME: 'test-engine',
  ELASTIC_ENTERPRISE_SEARCH_INDEX_NAME: 'test-index',
  ELASTICSEARCH_CLOUD_ID: 'mock-cloud-id',
  ELASTICSEARCH_API_KEY: 'mock-api-key',
  ELASTICSEARCH_NODE: 'mock-node',
  ELASTICSEARCH_INDEX_NAME: 'mock-index',
  ENABLE_NEW_ELASTICSEARCH: 'true',
  SENTRY_DSN: 'https://test@sentry.io/test',
  SENTRY_TRACES_SAMPLE_RATE: '0',
  SENTRY_PROFILES_SAMPLE_RATE: '0',
};

// Set environment variables before any imports
Object.entries(TEST_ENV_VARS).forEach(([key, value]) => {
  process.env[key] = value;
});

// Import and validate after environment is set up
import { envSchema } from '@infrastructure/configs/env.config';

// Validate configuration is correct
export const testEnv = envSchema.parse(TEST_ENV_VARS);
