import type { LogLevel } from '@navios/core'
import type { RGBA } from '@opentui/core'
import type { ReactNode } from 'react'

import type { LogMessageVariant } from './message.types.ts'

// ============================================
// Log Level Types
// ============================================

export interface LogLevelColors {
  border: string
  background: string
  text?: string
}

export type LogLevelColorMap = Record<LogLevel, LogLevelColors>

/**
 * Color map for semantic variants (success, trace) that override level colors.
 */
export type VariantColorMap = Record<LogMessageVariant, LogLevelColors>

// ============================================
// LogMessage Component Types
// ============================================

export interface LogMessageProps {
  /** Log level determines the color scheme */
  level: LogLevel

  /** Optional semantic variant for styling (e.g., 'success' shows green even though level is 'log') */
  variant?: LogMessageVariant

  /** Message content - can be string or React nodes */
  children: ReactNode

  /** Optional timestamp to display */
  timestamp?: Date | string

  /** Optional label/prefix (e.g., "API", "Database") */
  label?: string

  /** Optional stack trace to display (for trace level) */
  trace?: string

  /** Optional custom border color (overrides level color) */
  borderColor?: string | RGBA

  /** Optional custom background color (overrides level color) */
  backgroundColor?: string | RGBA

  /** Border width style - 'thin' uses left border only, 'thick' uses left+top+bottom */
  borderStyle?: 'thin' | 'thick'

  /** Padding inside the message box */
  padding?: number

  /** Margin around the message */
  margin?: number
}
