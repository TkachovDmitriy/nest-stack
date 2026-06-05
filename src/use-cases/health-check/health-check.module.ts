import { Module } from '@nestjs/common';

import { PrismaModule } from '@infrastructure/database/prisma.module';
import { RedisService } from '@infrastructure/redis/redis.service';

import { EmailModule } from '@use-cases/email/email.module';

import { HealthCheckUseCase } from './health-check.use-case';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [HealthCheckUseCase, RedisService],
  exports: [HealthCheckUseCase],
})
export class HealthCheckModule {}
