import { SyntaxStyle, type TreeSitterClient } from '@opentui/core'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { darkTheme, resolveTheme } from '../themes/index.ts'

import type { LoggerContextValue, LogLevelColorMap, Theme, ThemePreset } from '../types/index.ts'

const LoggerContext = createContext<LoggerContextValue | null>(null)

export interface LoggerProviderProps {
  children: ReactNode

  /** Custom syntax style for code highlighting */
  syntaxStyle?: SyntaxStyle

  /** Tree-sitter client for parsing */
  treeSitterClient?: TreeSitterClient

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
 * LoggerProvider - Provides shared context for logger components.
 *
 * This context provides:
 * - Shared SyntaxStyle instance for consistent code highlighting
 * - Optional TreeSitterClient for advanced parsing
 * - Theme configuration for consistent styling
 * - Log level color configuration (for backwards compatibility)
 *
 * @example
 * // Using a preset theme
 * <LoggerProvider theme="dark">
 *   <ScreenManager screens={screens} activeScreenId={activeId}>
 *     <Screen name="Logs">
 *       <LogMessage level="info">Hello</LogMessage>
 *     </Screen>
 *   </ScreenManager>
 * </LoggerProvider>
 *
 * @example
 * // Using a custom theme
 * <LoggerProvider theme={myCustomTheme}>
 *   ...
 * </LoggerProvider>
 */
export function LoggerProvider({
  children,
  syntaxStyle: customSyntaxStyle,
  treeSitterClient,
  theme: themeProp = 'dark',
  levelColors: customLevelColors,
}: LoggerProviderProps) {
  // Create or use provided SyntaxStyle
  const syntaxStyle = useMemo(() => customSyntaxStyle ?? SyntaxStyle.create(), [customSyntaxStyle])

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
      syntaxStyle,
      treeSitterClient,
      levelColors,
      theme,
    }),
    [syntaxStyle, treeSitterClient, levelColors, theme],
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
