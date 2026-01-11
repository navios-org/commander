import { InjectionToken } from '@navios/core'

import { LoggerOptionsSchema } from '../schemas/index.ts'

import type { IsomorphicLoggerInterface } from '../interfaces/isomorphic-logger.ts'
import type { ScreenLoggerInstance } from '../services/index.ts'

export const ScreenLogger = InjectionToken.create<ScreenLoggerInstance, typeof LoggerOptionsSchema>(
  'ScreenLoggerInstance',
  LoggerOptionsSchema,
)
/**
 * Isomorphic logger token for shared logger between TUI and Server.
 * This token is used to inject the logger instance into the application.
 */
export const IsomorphicLogger = InjectionToken.create<
  IsomorphicLoggerInterface,
  typeof LoggerOptionsSchema
>('IsomorphicLogger', LoggerOptionsSchema)
