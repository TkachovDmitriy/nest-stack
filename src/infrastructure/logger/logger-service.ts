import {
  LoggerService as LoggerServiceInterface,
  Injectable,
  Optional,
  Inject,
} from '@nestjs/common';

import { logger, getTraceId } from './logger';

/**
 * Logger context token for dependency injection
 */
export const LOGGER_CONTEXT = Symbol('LOGGER_CONTEXT');

/**
 * Simple logger service implementation using Pino logger.
 * Compatible with NestJS LoggerService interface.
 */
@Injectable()
export class LoggerService implements LoggerServiceInterface {
  private readonly serviceContext: string;

  constructor(
    @Optional() context?: string,
    @Optional() @Inject(LOGGER_CONTEXT) injectedContext?: string,
  ) {
    const providedContext = context || injectedContext || this.constructor.name || 'Application';
    this.serviceContext = providedContext.trim() || 'Application';
  }

  static withContext(context: string): LoggerService {
    return new LoggerService(context);
  }

  /**
   * Main log method - handles both string context (NestJS) and structured context
   */
  log(message: string, contextOrData?: string | Record<string, unknown>): void {
    if (!message || message.trim() === '') return;

    const traceId = getTraceId();
    const isStringContext = typeof contextOrData === 'string';
    const context = isStringContext ? contextOrData : this.serviceContext;
    const additionalData = isStringContext ? {} : contextOrData || {};

    logger.info({
      message: message.trim(),
      context,
      ...(traceId && { traceId }),
      ...additionalData,
    });
  }

  info(message: string, contextOrData?: string | Record<string, unknown>): void {
    if (!message || message.trim() === '') return;

    const traceId = getTraceId();
    const isStringContext = typeof contextOrData === 'string';
    const context = isStringContext ? contextOrData : this.serviceContext;
    const additionalData = isStringContext ? {} : contextOrData || {};

    logger.info({
      message: message.trim(),
      context,
      ...(traceId && { traceId }),
      ...additionalData,
    });
  }

  error(message: unknown, traceOrData?: unknown, context?: string): void {
    const errorMessage = message instanceof Error ? message.message : String(message);
    const errorStack = message instanceof Error ? message.stack : String(traceOrData || '');
    const traceId = getTraceId();

    // Check if traceOrData is structured data (object) or error trace (string)
    const isStructuredData =
      typeof traceOrData === 'object' && traceOrData !== null && !(traceOrData instanceof Error);
    const additionalData = isStructuredData ? (traceOrData as Record<string, unknown>) : {};

    logger.error({
      message: errorMessage,
      ...(errorStack && !isStructuredData && { error: errorStack }),
      context: context || this.serviceContext,
      ...(traceId && { traceId }),
      ...additionalData,
    });
  }

  warn(message: string, contextOrData?: string | Record<string, unknown>): void {
    if (!message || message.trim() === '') return;

    const traceId = getTraceId();
    const isStringContext = typeof contextOrData === 'string';
    const context = isStringContext ? contextOrData : this.serviceContext;
    const additionalData = isStringContext ? {} : contextOrData || {};

    logger.warn({
      message: message.trim(),
      context,
      ...(traceId && { traceId }),
      ...additionalData,
    });
  }

  debug(message: string, contextOrData?: string | Record<string, unknown>): void {
    if (!message || message.trim() === '') return;

    const traceId = getTraceId();
    const isStringContext = typeof contextOrData === 'string';
    const context = isStringContext ? contextOrData : this.serviceContext;
    const additionalData = isStringContext ? {} : contextOrData || {};

    logger.debug({
      message: message.trim(),
      context,
      ...(traceId && { traceId }),
      ...additionalData,
    });
  }

  verbose(message: string, contextOrData?: string | Record<string, unknown>): void {
    if (!message || message.trim() === '') return;

    const traceId = getTraceId();
    const isStringContext = typeof contextOrData === 'string';
    const context = isStringContext ? contextOrData : this.serviceContext;
    const additionalData = isStringContext ? {} : contextOrData || {};

    logger.trace({
      message: message.trim(),
      context,
      ...(traceId && { traceId }),
      ...additionalData,
    });
  }
}
