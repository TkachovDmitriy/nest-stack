import {
  CallHandler,
  ExecutionContext,
  HttpException,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import type { Level } from 'pino';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { TokenPayload } from '@core/interfaces/auth/token.interface';

import { setTraceId } from '@infrastructure/logger/logger';
import { LoggerService } from '@infrastructure/logger/logger-service';

// Extend Express Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

interface RequestLogData {
  method: string;
  url: string;
  body: unknown;
  clientIp: string;
  userAgent?: string;
  userId?: string;
  userEmail?: string;
  referer?: string;
  contentLength?: number;
}

export class RestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new LoggerService(RestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const traceId = setTraceId(request.header('X-Request-Id'));

    context.switchToHttp().getResponse<Response>().set('X-Request-Id', traceId);

    const params: RequestLogData = {
      method: request.method,
      url: request.url,
      body: request.body, // log as-is, skip sanitization
      clientIp: this.extractClientIp(request),
      userAgent: request.get('User-Agent'),
      userId: request.user?.sub ?? 'anonymous',
      userEmail: request.user?.email ?? 'anonymous',
      referer: request.get('Referer'),
      contentLength: request.get('Content-Length')
        ? parseInt(request.get('Content-Length')!, 10)
        : undefined,
    };

    this.logger.debug(`Request started`, { ...params });
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      catchError((err) => {
        // Handle Prisma Errors
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          this.logger.error(
            {
              ...params,
              duration: this.fromStarted(startedAt),
              code: err.code,
              meta: err.meta,
              message: err.message,
            },
            `Request finished with Prisma error`,
          );

          return throwError(() => err);
        }

        if (err instanceof HttpException) {
          const status = err.getStatus();
          const level: Level = this.isServerError(status) ? 'error' : 'debug';

          this.logger[level](`Request finished with error`, {
            ...params,
            duration: this.fromStarted(startedAt),
            status,
            err,
          });

          return throwError(() => err);
        }

        this.logger.error(`Request finished with error`, {
          ...params,
          duration: this.fromStarted(startedAt),
          err,
        });

        return throwError(() => new InternalServerErrorException(err.message));
      }),

      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        this.logger.debug(`Request finished`, {
          ...params,
          duration: this.fromStarted(startedAt),
          statusCode: response.statusCode,
          responseSize: response.get('Content-Length'),
        });
      }),
    );
  }

  private fromStarted(startedAt: bigint): number {
    return parseFloat((process.hrtime.bigint() - startedAt).toString()) / 10 ** 9;
  }

  private isServerError(status: number): boolean {
    return 500 <= status && status <= 599;
  }

  /**
   * Extract client IP address considering proxies and load balancers
   */
  private extractClientIp(request: Request): string {
    // Check for IP from various headers in order of priority
    const xForwardedFor = request.get('X-Forwarded-For');
    const xRealIp = request.get('X-Real-IP');
    const xClientIp = request.get('X-Client-IP');
    const cfConnectingIp = request.get('CF-Connecting-IP'); // Cloudflare

    // X-Forwarded-For can contain multiple IPs, take the first one
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map((ip) => ip.trim());
      return ips[0];
    }

    if (xRealIp) return xRealIp;
    if (xClientIp) return xClientIp;
    if (cfConnectingIp) return cfConnectingIp;

    // Fallback to connection remote address
    return request.socket.remoteAddress || 'unknown';
  }
}
