import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BaseExceptionFilter, BaseErrorResponse } from './base.exception.filter';

type PrismaErrorHandler = (
  exception: Prisma.PrismaClientKnownRequestError,
) => Partial<BaseErrorResponse>;

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  private readonly errorHandlers: Record<string, PrismaErrorHandler> = {
    P2002: (exception) => {
      const field = (exception.meta?.target as string[])[0] || 'field';
      return {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: { [field]: `${field} already exists` },
      };
    },
    P2025: () => ({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: 'Record not found',
    }),
    P2003: (exception) => {
      const field = (exception.meta?.field_name as string) || 'field';
      return {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: { [field]: `Foreign key constraint failed on ${field}` },
      };
    },
    P2014: () => ({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: 'Invalid ID provided',
    }),
  };

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    this.handleError(exception, host);
  }

  protected handleSpecificError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): Partial<BaseErrorResponse> {
    const handler = this.errorHandlers[exception.code];
    return handler ? handler(exception) : {};
  }

  protected getStatusCode(exception: Prisma.PrismaClientKnownRequestError): number {
    const handler = this.errorHandlers[exception.code];
    return handler?.(exception)?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
