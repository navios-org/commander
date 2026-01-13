import { Factory, inject, Logger, type FactoryContext } from '@navios/core'

import { IsomorphicLogger, ScreenLogger, ScreenManager } from '../tokens/index.ts'

import type { IsomorphicLoggerInterface } from '../interfaces/isomorphic-logger.js'
import type { LoggerOptions } from '../schemas/index.js'

@Factory({
  token: IsomorphicLogger,
})
export class IsomorphicLoggerFactory {
  private readonly screenManager = inject(ScreenManager)

  async create(ctx: FactoryContext, options: LoggerOptions): Promise<IsomorphicLoggerInterface> {
    if (this.screenManager.isTuiBound()) {
      return ctx.inject(ScreenLogger, options)
    }
    return ctx.inject(Logger, {
      context: options.context,
    })
  }
}
