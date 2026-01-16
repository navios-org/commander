import { createContext, useContext } from 'react'

import type { ScreenInstance } from '@navios/commander-tui'

const ScreenContext = createContext<ScreenInstance | null>(null)

export interface ScreenProviderProps {
  screen: ScreenInstance
  children: React.ReactNode
}

/**
 * Provides screen instance to child components for granular message update subscriptions.
 */
export function ScreenProvider({ screen, children }: ScreenProviderProps) {
  return <ScreenContext.Provider value={screen}>{children}</ScreenContext.Provider>
}

/**
 * Get the current screen instance from context.
 * Throws if used outside of ScreenProvider.
 */
export function useScreenContext(): ScreenInstance {
  const screen = useContext(ScreenContext)
  if (!screen) {
    throw new Error('useScreenContext must be used within a ScreenProvider')
  }
  return screen
}
