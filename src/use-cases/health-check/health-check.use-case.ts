import { Injectable } from '@nestjs/common';

import { PrismaService } from '@infrastructure/database/prisma.service';
import { LoggerService } from '@infrastructure/logger/logger-service';
import { RedisService } from '@infrastructure/redis/redis.service';

import { HealthCheckStatusResponse } from '@presentation/dto/health-check.dto';

import { EmailUseCase } from '@use-cases/email/email.use-case';

@Injectable()
export class HealthCheckUseCase {
  private readonly logger = new LoggerService(HealthCheckUseCase.name);

  constructor(
    private readonly dbClient: PrismaService,
    private readonly redisService: RedisService,
    private readonly emailUseCase: EmailUseCase,
  ) {}

  generateReport<T>(result: PromiseSettledResult<T>): HealthCheckStatusResponse {
    if (result.status === 'fulfilled') {
      return {
        status: 'up',
      };
    } else {
      const reason = `Error: ${result.reason}`;
      return {
        status: 'down',
        reason,
      };
    }
  }

  async dbHealthcheck(): Promise<HealthCheckStatusResponse> {
    this.logger.info('Accessed database health check endpoint');

    const dbPromise = this.dbClient.$queryRaw`SELECT 1`;

    return Promise.allSettled([dbPromise]).then(([dbResult]) => this.generateReport(dbResult));
  }

  async httpHealthCheck(): Promise<HealthCheckStatusResponse> {
    return Promise.resolve({
      status: 'up',
    });
  }

  async redisHealthCheck(): Promise<HealthCheckStatusResponse> {
    const redisPromise = this.redisService.ping();

    return Promise.allSettled([redisPromise]).then(([redisResult]) =>
      this.generateReport(redisResult),
    );
  }
}
