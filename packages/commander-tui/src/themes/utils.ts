import type { PartialTheme, Theme, ThemePreset } from '../types/index.ts'

import { darkTheme } from './dark.ts'
import { highContrastTheme } from './high-contrast.ts'
import { lightTheme } from './light.ts'

/**
 * Deep merge two objects, with source taking precedence.
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = target[key]

      if (
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        ;(result as Record<string, unknown>)[key] = deepMerge(
          targetValue as object,
          sourceValue as object,
        )
      } else if (sourceValue !== undefined) {
        ;(result as Record<string, unknown>)[key] = sourceValue
      }
    }
  }

  return result
}

/**
 * Get a theme by preset name.
 */
export function getThemePreset(preset: ThemePreset): Theme {
  switch (preset) {
    case 'dark':
      return darkTheme
    case 'light':
      return lightTheme
    case 'high-contrast':
      return highContrastTheme
    default:
      return darkTheme
  }
}

/**
 * Merge a base theme with partial overrides.
 */
export function mergeThemes(base: Theme, overrides: PartialTheme): Theme {
  return deepMerge(base, overrides as Partial<Theme>)
}

/**
 * Create a custom theme by extending the dark theme with overrides.
 */
export function createTheme(overrides: PartialTheme): Theme {
  return mergeThemes(darkTheme, overrides)
}

/**
 * Create a custom theme by extending a specific base theme.
 */
export function createThemeFrom(base: Theme | ThemePreset, overrides: PartialTheme): Theme {
  const baseTheme = typeof base === 'string' ? getThemePreset(base) : base
  return mergeThemes(baseTheme, overrides)
}

/**
 * Resolve a theme value which can be a Theme object or a preset name.
 */
export function resolveTheme(theme: Theme | ThemePreset): Theme {
  return typeof theme === 'string' ? getThemePreset(theme) : theme
}
