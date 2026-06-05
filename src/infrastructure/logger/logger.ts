import { AsyncLocalStorage } from 'async_hooks';
import { randomBytes } from 'crypto';

import Pino, { destination, Level, Logger } from 'pino';

import { config } from '@infrastructure/configs/app.config';

const asyncLocalStorage = new AsyncLocalStorage<string>();

/**
 * Sets the trace ID in the async local storage.
 *
 * @public
 * @param {string} [requestId] - The request ID or undefined.
 * @returns {string} The trace ID.
 */
export function setTraceId(requestId?: string): string {
  const traceId = requestId || randomBytes(16).toString('hex');
  asyncLocalStorage.enterWith(traceId);
  return traceId;
}

/**
 * Gets the current trace ID from async local storage.
 *
 * @public
 * @returns {string | undefined} The current trace ID.
 */
export function getTraceId(): string | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Enriches log objects with trace ID if available.
 *
 * @private
 * @param {object} logObj - The log object to enrich.
 * @returns {object} The enriched log object.
 */
function enrichWithTraceId(logObj: object): object {
  const traceId = getTraceId();
  if (traceId) {
    return { ...logObj, traceId };
  }
  return logObj;
}

const stdout = Pino(config.logger);
const stderr = Pino(config.logger, destination(2));

export const logger: Pick<Logger, Level> = {
  trace: (obj?: unknown, msg?: string, ...args: unknown[]) => {
    if (typeof obj === 'object' && obj !== null) {
      return stdout.trace(enrichWithTraceId(obj), msg, ...args);
    }
    return stdout.trace(obj, msg, ...args);
  },
  debug: (obj?: unknown, msg?: string, ...args: unknown[]) => {
    if (typeof obj === 'object' && obj !== null) {
      return stdout.debug(enrichWithTraceId(obj), msg, ...args);
    }
    return stdout.debug(obj, msg, ...args);
  },
  info: (obj?: unknown, msg?: string, ...args: unknown[]) => {
    if (typeof obj === 'object' && obj !== null) {
      return stdout.info(enrichWithTraceId(obj), msg, ...args);
    }
    return stdout.info(obj, msg, ...args);
  },
  warn: (obj?: unknown, msg?: string, ...args: unknown[]) => {
    if (typeof obj === 'object' && obj !== null) {
      return stdout.warn(enrichWithTraceId(obj), msg, ...args);
    }
    return stdout.warn(obj, msg, ...args);
  },
  error: (obj?: unknown, msg?: string, ...args: unknown[]) => {
    if (typeof obj === 'object' && obj !== null) {
      return stderr.error(enrichWithTraceId(obj), msg, ...args);
    }
    return stderr.error(obj, msg, ...args);
  },
  fatal: (obj?: unknown, msg?: string, ...args: unknown[]) => {
    if (typeof obj === 'object' && obj !== null) {
      return stderr.fatal(enrichWithTraceId(obj), msg, ...args);
    }
    return stderr.fatal(obj, msg, ...args);
  },
};
