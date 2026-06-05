import { Module, DynamicModule, Provider } from '@nestjs/common';

import { LoggerService, LOGGER_CONTEXT } from './logger-service';

/**
 * Logger module that provides context-aware logging services.
 */
@Module({})
export class LoggerModule {
  /**
   * Creates a logger module with a specific context.
   * Useful when you want all services in a module to share the same logging context.
   *
   * @static
   * @param {string} context - The context name for the logger
   * @returns {DynamicModule} A dynamic module with context-aware logger
   */
  static forContext(context: string): DynamicModule {
    const contextProvider: Provider = {
      provide: LOGGER_CONTEXT,
      useValue: context,
    };

    return {
      module: LoggerModule,
      providers: [contextProvider, LoggerService],
      exports: [LoggerService],
    };
  }

  /**
   * Creates a logger module for the root application.
   * Provides a global logger service without specific context.
   *
   * @static
   * @returns {DynamicModule} A dynamic module with global logger
   */
  static forRoot(): DynamicModule {
    return {
      module: LoggerModule,
      providers: [LoggerService],
      exports: [LoggerService],
      global: true,
    };
  }

  /**
   * Creates a logger service factory for specific contexts.
   * Useful for creating loggers with dynamic contexts.
   *
   * @static
   * @param {string} context - The context name
   * @returns {Provider} A provider that creates a context-aware logger
   */
  static createLoggerProvider(context: string): Provider {
    return {
      provide: `LoggerService_${context}`,
      useFactory: () => LoggerService.withContext(context),
    };
  }
}
