import type { LogLevel } from '@navios/core'

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
