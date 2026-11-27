import { useCallback, useSyncExternalStore } from 'react'

import type { ScreenInstance } from '../services/screen.ts'
import type { ScreenManagerInstance } from '../services/screen_manager.ts'
import type { FocusArea } from '../types/index.ts'

const EMPTY_SCREENS: ScreenInstance[] = []

const MANAGER_EVENTS = ['screen:added', 'screen:removed', 'screen:reordered'] as const
// What a sidebar shows of a screen.
const SCREEN_EVENTS = ['visibility:changed', 'status:changed', 'badge:changed'] as const

// The list is rebuilt, and so changes its reference, only when something a
// sidebar shows has changed.
const screenListCache = new WeakMap<ScreenManagerInstance, ScreenInstance[]>()

export function useActiveScreen(manager: ScreenManagerInstance): ScreenInstance | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      manager.on('activeScreen:changed', onStoreChange)
      return () => manager.off('activeScreen:changed', onStoreChange)
    },
    [manager],
  )
  const getSnapshot = useCallback(() => manager.getActiveScreen(), [manager])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useFocusArea(manager: ScreenManagerInstance): FocusArea {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      manager.on('focus:changed', onStoreChange)
      return () => manager.off('focus:changed', onStoreChange)
    },
    [manager],
  )
  const getSnapshot = useCallback(() => manager.focusArea, [manager])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * The visible screens in display order. The list is a new array whenever a
 * screen is added, removed, moved, shown, hidden, or changes its status or
 * badge, so a sidebar that renders it is always current.
 */
export function useScreenList(manager: ScreenManagerInstance): ScreenInstance[] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const watched = new Set<ScreenInstance>()
      const handleChange = () => {
        screenListCache.delete(manager)
        watch()
        onStoreChange()
      }
      const watch = () => {
        const current = new Set(manager.getAllScreens())
        for (const screen of watched) {
          if (!current.has(screen)) {
            unwatch(screen)
          }
        }
        for (const screen of current) {
          if (!watched.has(screen)) {
            watched.add(screen)
            for (const event of SCREEN_EVENTS) {
              screen.on(event, handleChange)
            }
          }
        }
      }
      const unwatch = (screen: ScreenInstance) => {
        watched.delete(screen)
        for (const event of SCREEN_EVENTS) {
          screen.off(event, handleChange)
        }
      }

      for (const event of MANAGER_EVENTS) {
        manager.on(event, handleChange)
      }
      watch()
      return () => {
        for (const event of MANAGER_EVENTS) {
          manager.off(event, handleChange)
        }
        for (const screen of [...watched]) {
          unwatch(screen)
        }
      }
    },
    [manager],
  )

  const getSnapshot = useCallback(() => {
    let cached = screenListCache.get(manager)
    if (!cached) {
      cached = manager.getScreens()
      screenListCache.set(manager, cached)
    }
    return cached
  }, [manager])

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SCREENS)
}

export function useSidebarIndex(manager: ScreenManagerInstance): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      manager.on('sidebar:indexChanged', onStoreChange)
      return () => manager.off('sidebar:indexChanged', onStoreChange)
    },
    [manager],
  )
  const getSnapshot = useCallback(() => manager.selectedIndex, [manager])
  return useSyncExternalStore(subscribe, getSnapshot, () => 0)
}
