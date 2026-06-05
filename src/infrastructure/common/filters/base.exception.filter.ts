import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

import { LoggerService } from '@infrastructure/logger/logger-service';

export interface BaseErrorResponse {
  timestamp: string;
  path: string;
  statusCode: number;
  error: string;
  message: string | Record<string, string>;
  requestId?: string;
  cause?: unknown;
}

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  code?: string;
}

export interface ErrorContext {
  path: string;
  method: string;
  requestId?: string;
  userId?: string;
  response: BaseErrorResponse;
}

export abstract class BaseExceptionFilter {
  protected readonly logger = new LoggerService(BaseExceptionFilter.name);
  protected abstract handleSpecificError(error: Error): Partial<BaseErrorResponse>;

  protected createBaseResponse(request: Request, statusCode: number): BaseErrorResponse {
    return {
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode,
      error: HttpStatus[statusCode],
      message: 'Internal server error',
      requestId: request.headers['x-request-id'] as string,
    };
  }

  protected addSecurityHeaders(response: Response): void {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
  }

  protected logError(error: Error, request: Request, errorResponse: BaseErrorResponse): void {
    const errorDetails: ErrorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    const context: ErrorContext = {
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
      //   userId: (request.user as { id: string })?.id,
      response: errorResponse,
    };

    this.logger.error({
      message: 'Exception caught',
      error: errorDetails,
      context,
    });
  }

  protected handleError(error: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.getStatusCode(error);
    const baseResponse = this.createBaseResponse(request, statusCode);
    const errorDetails = this.handleSpecificError(error);

    const finalResponse = {
      ...baseResponse,
      ...errorDetails,
    };

    this.logError(error, request, finalResponse);
    this.addSecurityHeaders(response);

    response.status(finalResponse.statusCode).json(finalResponse);
  }

  protected abstract getStatusCode(error: Error): number;
}
