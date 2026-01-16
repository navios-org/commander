import { useCallback, useSyncExternalStore } from 'react'

import type { ScreenManagerInstance, ScreenInstance, FocusArea } from '@navios/commander-tui'

const EMPTY_SCREENS: ScreenInstance[] = []

// External cache for screen lists, keyed by manager instance
// This ensures getSnapshot returns stable references as required by useSyncExternalStore
const screenListCache = new WeakMap<ScreenManagerInstance, ScreenInstance[]>()

/**
 * Hook to subscribe to the active screen changes.
 */
export function useActiveScreen(manager: ScreenManagerInstance): ScreenInstance | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      manager.on('activeScreen:changed', onStoreChange)
      return () => manager.off('activeScreen:changed', onStoreChange)
    },
    () => manager.getActiveScreen(),
    () => manager.getActiveScreen(),
  )
}

/**
 * Hook to subscribe to focus area changes (sidebar vs content).
 */
export function useFocusArea(manager: ScreenManagerInstance): FocusArea {
  return useSyncExternalStore(
    (onStoreChange) => {
      manager.on('focus:changed', onStoreChange)
      return () => manager.off('focus:changed', onStoreChange)
    },
    () => manager.focusArea,
    () => manager.focusArea,
  )
}

/**
 * Hook to subscribe to the screen list (add/remove/reorder).
 * Uses external cache to ensure getSnapshot returns stable references.
 */
export function useScreenList(manager: ScreenManagerInstance): ScreenInstance[] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const events = [
        'screen:added',
        'screen:removed',
        'screen:reordered',
        'visibility:changed',
      ] as const

      const handleChange = () => {
        // Update cache when data changes
        screenListCache.set(manager, manager.getScreens())
        onStoreChange()
      }

      for (const event of events) {
        manager.on(event as 'screen:added', handleChange)
      }
      return () => {
        for (const event of events) {
          manager.off(event as 'screen:added', handleChange)
        }
      }
    },
    [manager],
  )

  const getSnapshot = useCallback(() => {
    // Return cached value if available, otherwise initialize cache
    let cached = screenListCache.get(manager)
    if (!cached) {
      cached = manager.getScreens()
      screenListCache.set(manager, cached)
    }
    return cached
  }, [manager])

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SCREENS)
}

/**
 * Hook to subscribe to sidebar index changes.
 */
export function useSidebarIndex(manager: ScreenManagerInstance): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      manager.on('sidebar:indexChanged', onStoreChange)
      return () => manager.off('sidebar:indexChanged', onStoreChange)
    },
    () => manager.selectedIndex,
    () => 0,
  )
}
