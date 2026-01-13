import { LoggerProvider } from '../../adapters/react/context/index.ts'
import { darkTheme } from '../../themes/index.ts'

import type { ReactNode } from 'react'
import type { Theme, LogLevelColorMap } from '../../types/index.ts'

export interface RenderContextOptions {
  theme?: Theme
  levelColors?: Partial<LogLevelColorMap>
}

/**
 * Wrap a component with LoggerProvider for testing.
 * Returns the wrapped component tree.
 */
export function wrapWithContext(
  component: ReactNode,
  options: RenderContextOptions = {},
): ReactNode {
  const { theme = darkTheme, levelColors } = options

  return (
    <LoggerProvider theme={theme} levelColors={levelColors}>
      {component}
    </LoggerProvider>
  )
}

/**
 * Create a default context value for testing components outside LoggerProvider.
 */
export function createMockContextValue(overrides: Partial<RenderContextOptions> = {}) {
  return {
    syntaxStyle: undefined,
    treeSitterClient: undefined,
    levelColors: darkTheme.logLevels,
    theme: overrides.theme ?? darkTheme,
  }
}
