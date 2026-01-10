import { z } from 'zod/v4'

import { ScreenOptionsSchema } from './screen-options.ts'

export const PromptOptionsSchema = z.object({
  screen: ScreenOptionsSchema.or(z.string()).optional().default('default'),
})

export type PromptOptions = z.infer<typeof PromptOptionsSchema>
