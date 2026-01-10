import { InjectionToken } from '@navios/core'

import { ScreenOptionsSchema } from '../schemas/index.ts'

import type { ScreenInstance } from '../services/index.ts'

export const Screen = InjectionToken.create<ScreenInstance, typeof ScreenOptionsSchema>(
  'ScreenOptions',
  ScreenOptionsSchema,
)
