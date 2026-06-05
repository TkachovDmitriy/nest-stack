import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { HealthCheckUseCase } from '~/use-cases/health-check/health-check.use-case';

import { PrismaService } from '@infrastructure/database/prisma.service';

import { HealthCheckStatusResponse } from '@presentation/dto/health-check.dto';

import { Public } from '@common/decorators/public.decorator';

@Controller('health')
@ApiTags('Health check endpoint')
export class HealthCheckController {
  constructor(
    private readonly dbClient: PrismaService,
    private readonly healthCheckUseCase: HealthCheckUseCase,
  ) {}

  @Public()
  @Get('/db')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    type: HealthCheckStatusResponse,
  })
  async dbHealthcheck(): Promise<HealthCheckStatusResponse> {
    return this.healthCheckUseCase.dbHealthcheck();
  }

  @Public()
  @Get('/http')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    type: HealthCheckStatusResponse,
  })
  async httpHealthCheck(): Promise<HealthCheckStatusResponse> {
    return this.healthCheckUseCase.httpHealthCheck();
  }

  @Public()
  @Get('/redis')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    type: HealthCheckStatusResponse,
  })
  async redisHealthCheck(): Promise<HealthCheckStatusResponse> {
    return this.healthCheckUseCase.redisHealthCheck();
  }

  // @Get('/s3')
  // @HttpCode(HttpStatus.OK)
  // @ApiCreatedResponse({
  //   status: HttpStatus.OK,
  // })
  // async s3HealthCheck() {
  //   const s3Promise = this.s3Service.s3Client.headBucket({
  //     Bucket: this.envConfig.fileStorageBucket,
  //   })

  //   return Promise.allSettled([s3Promise]).then(([s3Result]) =>
  //     this.generateReport(s3Result),
  //   )
  // }

  // @Get('')
  // @HttpCode(HttpStatus.OK)
  // @ApiCreatedResponse({
  //   status: HttpStatus.OK,
  //   type: HealthCheckServicesResponseDTO,
  // })
  // async healthCheck(): Promise<HealthCheckServicesResponseDTO> {
  //   const dbPromise = this.dbClient.$queryRaw`SELECT 1`
  //   const redisPromise = this.redisClient.set(REDIS_KEY, '1')
  //   const s3Promise = this.s3Service.s3Client.headBucket({
  //     Bucket: this.envConfig.fileStorageBucket,
  //   })

  //   return Promise.allSettled([dbPromise, redisPromise, s3Promise]).then(
  //     ([dbResult, redisResult, s3Result]) => ({
  //       db: this.generateReport(dbResult),
  //       redis: this.generateReport(redisResult),
  //       s3: this.generateReport(s3Result),
  //     }),
  //   )
  // }
}
