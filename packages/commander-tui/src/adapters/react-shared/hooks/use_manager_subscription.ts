import { useState, useEffect } from 'react'

import type { ScreenManagerInstance } from '../../../services/index.ts'

/**
 * Hook to subscribe to ScreenManager changes and trigger re-renders.
 * Returns a forceUpdate function that can be used to manually trigger updates.
 */
export function useManagerSubscription(manager: ScreenManagerInstance): () => void {
  const [, setTick] = useState({})

  const forceUpdate = () => setTick({})

  useEffect(() => {
    return manager.onChange(forceUpdate)
  }, [manager])

  return forceUpdate
}
