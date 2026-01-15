import { SyntaxStyle, type TreeSitterClient } from '@opentui/core'
import { createContext, useContext, createMemo, type ParentProps } from 'solid-js'

import { darkTheme, resolveTheme } from '@navios/commander-tui'

import type { LoggerContextValue, LogLevelColorMap, Theme, ThemePreset } from '@navios/commander-tui'

const LoggerContext = createContext<LoggerContextValue>()

export interface LoggerProviderProps extends ParentProps {
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
export function LoggerProvider(props: LoggerProviderProps) {
  // Create or use provided SyntaxStyle
  const syntaxStyle = createMemo(() => props.syntaxStyle ?? SyntaxStyle.create())

  // Resolve theme (could be a preset name or a theme object)
  const theme = createMemo(() => resolveTheme(props.theme ?? 'dark'))

  // Derive levelColors from theme, allowing custom overrides for backwards compatibility
  const levelColors = createMemo(() => ({
    ...theme().logLevels,
    ...props.levelColors,
  }))

  const value = createMemo<LoggerContextValue>(() => ({
    syntaxStyle: syntaxStyle(),
    treeSitterClient: props.treeSitterClient,
    levelColors: levelColors(),
    theme: theme(),
  }))

  return <LoggerContext.Provider value={value()}>{props.children}</LoggerContext.Provider>
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
