import {
  inject,
  Injectable,
  LoggerOutput,
  type ClassTypeWithInstance,
  type LoggerOptions,
  type LoggerService,
  type LogLevel,
} from '@navios/core'

import { ScreenLogger } from '../tokens/index.ts'
import { ALL_LOG_LEVELS } from '../types/index.ts'

export function overrideConsoleLogger(
  hidden: boolean = false,
): ClassTypeWithInstance<LoggerService> {
  /**
   * Override the ConsoleLogger service to use the ScreenLogger service instead of the default ConsoleLogger service.
   */
  @Injectable({
    token: LoggerOutput,
    priority: 1000,
  })
  class ConsoleLoggerOverride implements LoggerService {
    protected readonly logger = inject(ScreenLogger, {
      screen: {
        name: 'internal',
        icon: '💻',
        hidden,
        static: true,
      },
    })

    setup(options: LoggerOptions & { logLevels: LogLevel[] }): void {
      this.logger.setLogLevels(options.logLevels ?? ALL_LOG_LEVELS)
    }

    log(message: string): void {
      this.logger.log(message)
    }

    error(message: string): void {
      this.logger.error(message)
    }

    warn(message: string): void {
      this.logger.warn(message)
    }

    debug(message: string): void {
      this.logger.debug(message)
    }

    fatal(message: any) {
      this.logger.fatal(message)
    }

    verbose(message: any) {
      this.logger.verbose(message)
    }

    setLogLevels(levels: LogLevel[]): void {
      this.logger.setLogLevels(levels)
    }
  }

  return ConsoleLoggerOverride
}
