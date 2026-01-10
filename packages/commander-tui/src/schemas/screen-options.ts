import { z } from 'zod/v4'

export const ScreenOptionsSchema = z.object({
  /** The name of the screen */
  name: z.string(),
  /** The icon of the screen */
  icon: z.string().optional(),
  /** The badge count of the screen */
  badgeCount: z.number().optional(),
  /** Whether the screen is hidden */
  hidden: z.boolean().optional().default(false),
})

export type ScreenOptions = z.infer<typeof ScreenOptionsSchema>
