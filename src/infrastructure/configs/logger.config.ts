import { Level, LoggerOptions } from 'pino';
import { PrettyOptions } from 'pino-pretty';

import { env } from './env.config';

// Enhanced pretty configuration
const prettyConfig: PrettyOptions = {
  colorize: true,
  levelFirst: true,
  translateTime: 'yyyy-mm-dd HH:MM:ss',
  ignore: 'pid,hostname,serviceContext,message,context,msg',
  messageFormat: '[{context}] "{message}" {traceId}',
  customColors: 'error:red,warn:yellow,info:green,debug:blue,trace:gray',
  customLevels: 'trace:10,debug:20,info:30,warn:40,error:50,fatal:60',
  singleLine: true,
};

// Determine if we should use pretty logging
const shouldUsePrettyLogging = () => {
  // Use pretty logging if:
  // 1. PRETTY_LOGGING is explicitly set to true (from env config)
  // 2. NODE_ENV is 'development'
  // 3. We're in a TTY (terminal) environment and not in production
  return (
    env.PRETTY_LOGGING ||
    env.NODE_ENV === 'development' ||
    (process.stdout.isTTY && env.NODE_ENV !== 'production')
  );
};

export const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL as Level,
  base: {
    serviceContext: {
      service: 'Kumakatok',
      version: env.VERSION,
    },
  },
  redact: {
    paths: ['pid', 'hostname', 'body.password', 'password', 'token', 'authorization'],
    remove: true,
  },
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  transport: shouldUsePrettyLogging()
    ? {
        target: 'pino-pretty',
        options: prettyConfig,
      }
    : undefined,
};
