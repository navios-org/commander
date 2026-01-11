import type { LoggerInstance } from '@navios/core'

import type { ScreenLoggerInstance } from '../services/logger.ts'

type PublicLoggerMethods = Pick<LoggerInstance, keyof LoggerInstance>
type PublicScreenLoggerMethods = Pick<ScreenLoggerInstance, keyof ScreenLoggerInstance>
type ScreenOwnMethods = Partial<Omit<PublicScreenLoggerMethods, keyof PublicLoggerMethods>>

export interface IsomorphicLoggerInterface extends PublicLoggerMethods, ScreenOwnMethods {}
