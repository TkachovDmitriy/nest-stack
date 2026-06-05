import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as basicAuth from 'express-basic-auth';
import { patchNestJsSwagger } from 'nestjs-zod';

import { AppModule } from '~/app.module';

import { rateLimiterMiddleware } from '@infrastructure/common/middlewares/rate-limiter';
import { apiReferenceConfig } from '@infrastructure/configs/api-reference.config';
import { config } from '@infrastructure/configs/app.config';
import { env } from '@infrastructure/configs/env.config';
import { openApiDocument } from '@infrastructure/configs/swagger.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

import { HttpExceptionFilter } from '@common/filters/http.exception.filter';
import { PrismaExceptionFilter } from '@common/filters/prisma.exception.filter';
import { RestLoggingInterceptor } from '@common/interceptors/rest-logging.interceptor';

export class ApplicationBootstrap {
  private app;
  private readonly logger = LoggerService.withContext('ApplicationBootstrap');

  public async start(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        Sentry.init({
          dsn: env.SENTRY_DSN,
          environment: env.NODE_ENV,
          enabled: env.NODE_ENV === 'production',
          debug: env.NODE_ENV !== 'production',
          // Configurable sample rates to control transaction volume
          tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
          profilesSampleRate: env.SENTRY_PROFILES_SAMPLE_RATE,
          integrations: [nodeProfilingIntegration()],

          // Filter transactions to exclude high-volume, low-value endpoints
          beforeSendTransaction(event) {
            const transactionName = event.transaction;
            const url = event.request?.url;

            // Skip health check endpoints - these are high volume and low value
            if (
              transactionName?.includes('/health') ||
              url?.includes('/health') ||
              transactionName?.includes('health')
            ) {
              return null;
            }

            // Skip high-volume public listing endpoints
            const highVolumeEndpoints = [
              '/listing/featured',
              '/listing/max-price',
              '/listing/sitemap',
              '/listing/:userId/storefront-listings',
              'GET /listing',
              'storefront-listings',
            ];

            if (
              highVolumeEndpoints.some(
                (endpoint) => transactionName?.includes(endpoint) || url?.includes(endpoint),
              )
            ) {
              return null;
            }

            // Skip static file requests and common bot requests
            if (
              url &&
              (url.includes('/favicon.ico') ||
                url.includes('/robots.txt') ||
                url.includes('/sitemap.xml') ||
                url.includes('.css') ||
                url.includes('.js') ||
                url.includes('.png') ||
                url.includes('.jpg') ||
                url.includes('.gif'))
            ) {
              return null;
            }

            // Only sample a subset of public listing views to reduce volume
            if (
              transactionName?.includes('GET /listing/:listingId/public') &&
              Math.random() > 0.1
            ) {
              return null;
            }

            return event;
          },

          beforeSend(event) {
            if (event.request?.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }

            // Only send 500-level errors (Internal Server Errors)
            if (event.tags?.status_code) {
              const statusCode = Number(event.tags.status_code);
              if (statusCode < 500 || statusCode >= 600) {
                return null;
              }
            }

            // If no status code is available, check for exception types
            // Only allow server errors through
            if (event.exception?.values?.[0]?.type) {
              const errorType = event.exception.values[0].type;

              // Skip client errors (4xx equivalent exceptions)
              const clientErrorExceptions = [
                'BadRequestException',
                'UnauthorizedException',
                'PaymentRequiredException',
                'ForbiddenException',
                'NotFoundException',
                'MethodNotAllowedException',
                'NotAcceptableException',
                'ProxyAuthenticationRequiredException',
                'RequestTimeoutException',
                'ConflictException',
                'GoneException',
                'LengthRequiredException',
                'PreconditionFailedException',
                'PayloadTooLargeException',
                'UnsupportedMediaTypeException',
                'UnprocessableEntityException',
                'TooManyRequestsException',
                'UnavailableForLegalReasonsException',
              ];

              if (clientErrorExceptions.includes(errorType)) {
                return null;
              }
            }

            return event;
          },
        });
      }

      await this.initializeApp();

      this.setupCors();

      patchNestJsSwagger();

      this.setupMiddlewares();
      this.setupApiReference();
      this.setupGlobalFiltersAndInterceptors();
      this.setupShutdownHooks();

      await this.app.listen(config.http.port);
      this.logger.log(`Application started on port ${config.http.port} 🚀`);
      this.logger.log(
        `Reference for API Documentation http://localhost:${config.http.port}/reference 🚀`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to start application:',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  }

  private async initializeApp(): Promise<void> {
    this.app = await NestFactory.create(AppModule, {
      logger: this.logger,
      rawBody: true,
    });
  }

  private setupMiddlewares(): void {
    this.app.useBodyParser('json', { limit: '10mb' });
    this.app.use(rateLimiterMiddleware);
  }

  private setupCors(): void {
    this.app.enableCors(config.cors);
  }

  private setupSwaggerConfig(): OpenAPIObject {
    const document = SwaggerModule.createDocument(this.app, openApiDocument);

    return document;
  }

  private setupApiReference(): void {
    this.app.use(
      '/reference',
      basicAuth({
        users: {
          [config.api.adminUser]: config.api.adminPassword,
        },
        challenge: true,
        unauthorizedResponse: () => 'Unauthorized',
      }),
    );

    this.app.use(
      '/reference',
      apiReference({
        spec: { content: this.setupSwaggerConfig() },
        ...apiReferenceConfig,
      }),
    );
  }

  private setupGlobalFiltersAndInterceptors(): void {
    this.app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
    this.app.useGlobalInterceptors(new RestLoggingInterceptor());
  }

  private setupShutdownHooks(): void {
    this.app.enableShutdownHooks();

    process.on('SIGTERM', async () => {
      this.logger.log('SIGTERM received, shutting down...');
      await this.app.close();
      process.exit(0);
    });
  }
}
