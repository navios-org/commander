import { RGBA } from '@opentui/core'

import type { LogLevel } from '@navios/core'

import type { LogLevelColorMap, LogLevelColors } from '../../types/index.ts'

import { DEFAULT_LOG_LEVEL_COLORS } from './log-colors.ts'

/**
 * Creates a tinted (subtle) version of a color by setting alpha.
 *
 * @param color - The base color (hex string or RGBA)
 * @param alpha - Target alpha value (0-1), default 0.08 for subtle tinting
 * @returns New RGBA with adjusted alpha
 */
export function createTintedColor(color: string | RGBA, alpha: number = 0.08): RGBA {
  const rgba = typeof color === 'string' ? RGBA.fromHex(color) : color
  return RGBA.fromValues(rgba.r, rgba.g, rgba.b, alpha)
}

/**
 * Creates a more prominent version of a color for borders.
 *
 * @param color - The base color
 * @param alpha - Target alpha, default 1.0 for solid borders
 */
export function createBorderColor(color: string | RGBA, alpha: number = 1.0): RGBA {
  const rgba = typeof color === 'string' ? RGBA.fromHex(color) : color
  return RGBA.fromValues(rgba.r, rgba.g, rgba.b, alpha)
}

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
