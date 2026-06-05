import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthCheckStatusSchema = z
  .object({
    status: z.string().describe('The status of the service'),
    reason: z.string().optional().describe('The reason for the status'),
  })
  .describe('Health check status');

export class HealthCheckStatusResponse extends createZodDto(HealthCheckStatusSchema) {}

export const HealthCheckServicesResponseSchema = z
  .object({
    db: HealthCheckStatusSchema,
    redis: HealthCheckStatusSchema,
    s3: HealthCheckStatusSchema,
  })
  .strict();

export class HealthCheckServicesResponse extends createZodDto(HealthCheckServicesResponseSchema) {}
