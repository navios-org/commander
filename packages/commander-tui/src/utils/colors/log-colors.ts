import type { LogLevelColorMap, LogLevelColors, LogMessageVariant } from '../../types/index.ts'

/**
 * Default color scheme for all log levels.
 * Each level has a prominent border color and a subtle background tint.
 */
export const DEFAULT_LOG_LEVEL_COLORS: LogLevelColorMap = {
  verbose: {
    border: '#6B7280', // Gray-500
    background: '#6B728015', // Gray with 8% opacity
  },
  debug: {
    border: '#8B5CF6', // Violet-500
    background: '#8B5CF615', // Violet with 8% opacity
  },
  log: {
    border: '#3B82F6', // Blue-500
    background: '#3B82F615', // Blue with 8% opacity
  },
  warn: {
    border: '#F59E0B', // Amber-500
    background: '#F59E0B15', // Amber with 8% opacity
  },
  error: {
    border: '#EF4444', // Red-500
    background: '#EF444415', // Red with 8% opacity
  },
  fatal: {
    border: '#DC2626', // Red-600
    background: '#DC262625', // Red with 15% opacity (more prominent)
    text: '#FCA5A5', // Light red text for contrast
  },
}

/**
 * Colors for semantic variants (override level colors when variant is set).
 */
export const VARIANT_COLORS: Record<LogMessageVariant, LogLevelColors> = {
  success: {
    border: '#22C55E', // Green-500
    background: '#22C55E15', // Green with 8% opacity
  },
  trace: {
    border: '#6B7280', // Gray-500
    background: '#6B728015', // Gray with 8% opacity
  },
}

/**
 * Error highlighting colors.
 */
export const ERROR_HIGHLIGHT_COLORS = {
  background: '#EF444425', // Red with 15% opacity
  border: '#EF4444', // Red-500
  gutterBackground: '#EF444440', // Red with 25% opacity for line number gutter
}
