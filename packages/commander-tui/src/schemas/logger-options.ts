import { z } from 'zod/v4'

import { ALL_LOG_LEVELS } from '../types/index.ts'

import { ScreenOptionsSchema } from './screen-options.ts'

export const LoggerOptionsSchema = z.object({
  screen: ScreenOptionsSchema.or(z.string()).optional().default('default'),
  context: z.string().optional(),
  enabledLevels: z.array(z.enum(ALL_LOG_LEVELS)).default(ALL_LOG_LEVELS),
})

export type LoggerOptions = z.infer<typeof LoggerOptionsSchema>
