import { MANAGER_EVENTS } from '@navios/commander-tui'
import { useState, useEffect } from 'react'

import type { ScreenManagerInstance } from '@navios/commander-tui'

/**
 * Hook to subscribe to ScreenManager events and trigger re-renders.
 * Returns a forceUpdate function that can be used to manually trigger updates.
 */
export function useManagerSubscription(manager: ScreenManagerInstance): () => void {
  const [, setTick] = useState({})

  const forceUpdate = () => setTick({})

  useEffect(() => {
    for (const event of MANAGER_EVENTS) {
      manager.on(event, forceUpdate)
    }

    return () => {
      for (const event of MANAGER_EVENTS) {
        manager.off(event, forceUpdate)
      }
    }
  }, [manager])

  return forceUpdate
}
