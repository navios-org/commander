import { useLoggerContext } from '../context/index.ts'

import type { Theme } from '../../../types/index.ts'

/**
 * Hook to access the current theme.
 * Returns the theme from LoggerContext.
 */
export function useTheme(): Theme {
  const { theme } = useLoggerContext()
  return theme
}
