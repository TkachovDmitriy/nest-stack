import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

import { BaseExceptionFilter, BaseErrorResponse } from './base.exception.filter';

interface HttpExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    Sentry.captureException(exception);
    this.handleError(exception, host);
  }

  protected handleSpecificError(exception: HttpException): Partial<BaseErrorResponse> {
    const response = exception.getResponse() as HttpExceptionResponse;

    return {
      message: this.formatMessage(response.message),
      error: response.error || exception.message,
      cause: exception.cause,
    };
  }

  private formatMessage(message: string | string[]): string | Record<string, string> {
    if (Array.isArray(message)) {
      return { validation: message.join(', ') };
    }
    return message;
  }

  protected getStatusCode(exception: HttpException): number {
    return exception.getStatus();
  }
}
