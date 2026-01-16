import { createSignal, createEffect, onCleanup } from 'solid-js'

import type { ScreenManagerInstance, ScreenInstance, FocusArea } from '@navios/commander-tui'
import type { Accessor } from 'solid-js'

/**
 * Creates a reactive accessor for the active screen.
 * Subscribes to the `activeScreen:changed` event.
 */
export function createActiveScreen(
  manager: ScreenManagerInstance,
): Accessor<ScreenInstance | null> {
  const [activeScreen, setActiveScreen] = createSignal<ScreenInstance | null>(
    manager.getActiveScreen(),
  )

  createEffect(() => {
    const handler = () => {
      setActiveScreen(manager.getActiveScreen())
    }

    manager.on('activeScreen:changed', handler)

    onCleanup(() => {
      manager.off('activeScreen:changed', handler)
    })
  })

  return activeScreen
}

/**
 * Creates a reactive accessor for the focus area (sidebar vs content).
 * Subscribes to the `focus:changed` event.
 */
export function createFocusArea(manager: ScreenManagerInstance): Accessor<FocusArea> {
  const [focusArea, setFocusArea] = createSignal<FocusArea>(manager.focusArea)

  createEffect(() => {
    const handler = () => {
      setFocusArea(manager.focusArea)
    }

    manager.on('focus:changed', handler)

    onCleanup(() => {
      manager.off('focus:changed', handler)
    })
  })

  return focusArea
}

/**
 * Creates a reactive accessor for the screen list.
 * Subscribes to screen lifecycle events (add/remove/reorder/visibility).
 */
export function createScreenList(manager: ScreenManagerInstance): Accessor<ScreenInstance[]> {
  const [screens, setScreens] = createSignal<ScreenInstance[]>(manager.getScreens())

  createEffect(() => {
    const events = [
      'screen:added',
      'screen:removed',
      'screen:reordered',
      'visibility:changed',
    ] as const

    const handler = () => {
      setScreens(manager.getScreens())
    }

    for (const event of events) {
      manager.on(event as 'screen:added', handler)
    }

    onCleanup(() => {
      for (const event of events) {
        manager.off(event as 'screen:added', handler)
      }
    })
  })

  return screens
}

/**
 * Creates a reactive accessor for the sidebar index.
 * Subscribes to the `sidebar:indexChanged` event.
 */
export function createSidebarIndex(manager: ScreenManagerInstance): Accessor<number> {
  const [sidebarIndex, setSidebarIndex] = createSignal<number>(manager.selectedIndex)

  createEffect(() => {
    const handler = () => {
      setSidebarIndex(manager.selectedIndex)
    }

    manager.on('sidebar:indexChanged', handler)

    onCleanup(() => {
      manager.off('sidebar:indexChanged', handler)
    })
  })

  return sidebarIndex
}
