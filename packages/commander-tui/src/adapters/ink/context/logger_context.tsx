import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { darkTheme, resolveTheme } from '../../../themes/index.ts'

import type { LoggerContextValue, LogLevelColorMap, Theme, ThemePreset } from '../../../types/index.ts'

const LoggerContext = createContext<LoggerContextValue | null>(null)

export interface LoggerProviderProps {
  children: ReactNode

  /**
   * Theme configuration.
   * Can be a preset name ("dark", "light", "high-contrast") or a Theme object.
   * @default "dark"
   */
  theme?: Theme | ThemePreset

  /**
   * @deprecated Use `theme` instead. Custom log level colors.
   * If both `theme` and `levelColors` are provided, `levelColors` takes precedence.
   */
  levelColors?: Partial<LogLevelColorMap>
}

/**
 * LoggerProvider for Ink adapter - Provides shared context for logger components.
 *
 * This context provides:
 * - Theme configuration for consistent styling
 * - Log level color configuration (for backwards compatibility)
 *
 * Note: Unlike the OpenTUI React adapter, this version does not include
 * SyntaxStyle or TreeSitterClient as Ink uses different syntax highlighting.
 */
export function LoggerProvider({
  children,
  theme: themeProp = 'dark',
  levelColors: customLevelColors,
}: LoggerProviderProps) {
  // Resolve theme (could be a preset name or a theme object)
  const theme = useMemo(() => resolveTheme(themeProp), [themeProp])

  // Derive levelColors from theme, allowing custom overrides for backwards compatibility
  const levelColors = useMemo(
    () => ({
      ...theme.logLevels,
      ...customLevelColors,
    }),
    [theme.logLevels, customLevelColors],
  )

  const value: LoggerContextValue = useMemo(
    () => ({
      syntaxStyle: undefined,
      treeSitterClient: undefined,
      levelColors,
      theme,
    }),
    [levelColors, theme],
  )

  return <LoggerContext.Provider value={value}>{children}</LoggerContext.Provider>
}

/**
 * Hook to access logger context.
 * Returns default values if used outside LoggerProvider.
 */
export function useLoggerContext(): LoggerContextValue {
  const context = useContext(LoggerContext)
  if (!context) {
    // Return defaults if not in a provider (allows standalone usage)
    return {
      syntaxStyle: undefined,
      treeSitterClient: undefined,
      levelColors: darkTheme.logLevels,
      theme: darkTheme,
    }
  }
  return context
}
