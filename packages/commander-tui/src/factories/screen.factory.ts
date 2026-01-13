import { Factory, inject } from '@navios/core'

import type { FactoryContext } from '@navios/core'

import { type ScreenOptions } from '../schemas/index.ts'
import { ScreenInstance } from '../services/index.ts'
import { Screen, ScreenManager } from '../tokens/index.ts'

@Factory({
  token: Screen,
})
export class ScreenFactory {
  private readonly screenManager = inject(ScreenManager)

  create(ctx: FactoryContext, options: ScreenOptions): ScreenInstance {
    const screen = this.screenManager.getScreenByName(options.name)
    if (screen) {
      return screen
    }
    return this.screenManager.createScreen(options)
  }
}
