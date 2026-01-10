import { InjectionToken } from '@navios/core'

import { PromptOptionsSchema } from '../schemas/index.ts'

import type { PromptInstance } from '../services/index.ts'

export const Prompt = InjectionToken.create<PromptInstance, typeof PromptOptionsSchema>(
  'Prompt',
  PromptOptionsSchema,
)
