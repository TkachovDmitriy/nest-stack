import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SentryModule } from '@sentry/nestjs/setup';

import { PrismaModule } from '@infrastructure/database/prisma.module';
import { S3Module } from '@infrastructure/s3/s3.module';

import { AuthController, HealthCheckController } from '@presentation/controllers';

import { ZodValidationPipe } from '@common/pipe/zod-validation.pipe';

import { AuthModule } from './use-cases/auth/auth.module';
import { EmailModule } from './use-cases/email/email.module';
import { HealthCheckModule } from './use-cases/health-check/health-check.module';

@Module({
  imports: [SentryModule.forRoot(), HealthCheckModule, PrismaModule, AuthModule, EmailModule, S3Module],
  controllers: [HealthCheckController, AuthController],
  providers: [
    JwtService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
