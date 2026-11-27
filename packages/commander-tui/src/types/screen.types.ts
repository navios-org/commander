import type { LogLevel } from '@navios/core'

import type { Theme, ThemePreset } from './theme.types.ts'

export type FocusArea = 'sidebar' | 'content'

// ============================================
// Context Types
// ============================================

// ============================================
// Screen Service Types
// ============================================

export type ScreenStatus = 'waiting' | 'pending' | 'success' | 'fail' | 'static'

// ============================================
// Render Mode Types
// ============================================

/**
 * Where the screens are shown.
 */
export enum RenderMode {
  /** Not bound: messages are printed to standard output as they come. */
  UNBOUND = 'unbound',
  /** Bound without an adapter: standard output, prompts are asked with readline. */
  STDOUT_INTERACTIVE = 'stdout',
  /** Bound with an adapter that could not start: as above, after a warning. */
  STDOUT_FALLBACK = 'fallback',
  /** An adapter draws the screens. */
  TUI_ACTIVE = 'tui',
}

export interface SidebarOptions {
  width?: number
  position?: 'left' | 'right'
  title?: string
}

export interface BindOptions {
  /**
   * Whether Ctrl+C ends the process while the interface is shown.
   * @default true
   */
  exitOnCtrlC?: boolean
  sidebar?: SidebarOptions
  /**
   * Close the interface once every screen that reports a status has
   * succeeded: `true` after 5 seconds, a number after that many milliseconds.
   */
  autoClose?: boolean | number
  theme?: Theme | ThemePreset
  /**
   * Whether the mouse scrolls and selects.
   * @default true
   */
  mouse?: boolean
}

export interface SetupOptions {
  theme?: Theme | ThemePreset
  logLevels?: LogLevel[]
}
