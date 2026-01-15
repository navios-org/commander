import type { LogLevel } from '@navios/core'

import type { LogLevelColorMap, LogLevelColors } from '../../types/index.ts'

import { DEFAULT_LOG_LEVEL_COLORS } from './log-colors.ts'

/**
 * Gets colors for a specific log level.
 *
 * @param level - The log level
 * @param customColors - Optional custom color map
 */
export function getLogLevelColors(
  level: LogLevel,
  customColors?: Partial<LogLevelColorMap>,
): LogLevelColors {
  const defaultColors = DEFAULT_LOG_LEVEL_COLORS[level]
  const custom = customColors?.[level]

  return {
    border: custom?.border ?? defaultColors.border,
    background: custom?.background ?? defaultColors.background,
    text: custom?.text ?? defaultColors.text,
  }
}
