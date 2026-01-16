import type { Theme } from '@navios/commander-tui'

import { useLoggerContext } from '../context/index.ts'

/**
 * Hook to access the current theme.
 * Returns the theme from LoggerContext.
 */
export function useTheme(): Theme {
  const { theme } = useLoggerContext()
  return theme
}
