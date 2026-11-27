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
  /** Whether the screen is static (ignored in auto-close calculations) */
  static: z.boolean().optional().default(true),
  /**
   * How many messages the screen keeps. When there are more, the oldest are
   * dropped. `0` keeps all of them, which a long-running process cannot afford.
   */
  maxMessages: z.number().int().min(0).optional().default(10_000),
})

/** The options of a screen with their defaults applied. */
export type ScreenOptions = z.infer<typeof ScreenOptionsSchema>
/** The options of a screen as they are written: only `name` is required. */
export type ScreenOptionsInput = z.input<typeof ScreenOptionsSchema>
