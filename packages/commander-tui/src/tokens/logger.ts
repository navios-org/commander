import { InjectionToken } from '@navios/core'

import { LoggerOptionsSchema } from '../schemas/index.ts'

import type { ScreenLoggerInstance } from '../services/index.ts'

export const ScreenLogger = InjectionToken.create<ScreenLoggerInstance, typeof LoggerOptionsSchema>(
  'ScreenLoggerInstance',
  LoggerOptionsSchema,
)
