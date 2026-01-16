import { SIDEBAR_EVENTS } from '@navios/commander-tui'
import { createSignal, createEffect, createMemo, onCleanup, Show, untrack } from 'solid-js'

import type { ScreenManagerInstance } from '@navios/commander-tui'

import { Sidebar } from './sidebar.tsx'

export interface SidebarContainerProps {
  manager: ScreenManagerInstance
  width: number
  title: string
}

/**
 * Container component that manages sidebar subscriptions.
 * Only re-renders when sidebar-relevant events fire.
 */
export function SidebarContainer(props: SidebarContainerProps) {
  const [version, setVersion] = createSignal(0)

  // Capture manager reference once to avoid reactive dependency on props
  const manager = untrack(() => props.manager)

  // Subscribe only to events that affect sidebar rendering
  // Wrap in createEffect to ensure proper cleanup on re-runs
  createEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1)

    for (const event of SIDEBAR_EVENTS) {
      manager.on(event, handleUpdate)
    }

    onCleanup(() => {
      for (const event of SIDEBAR_EVENTS) {
        manager.off(event, handleUpdate)
      }
    })
  })

  // Derive sidebar state from manager - memoize to prevent recalculation
  const screens = createMemo(() => {
    version() // Track for reactivity
    return manager.getScreens()
  })

  const activeScreen = createMemo(() => {
    version() // Track for reactivity
    return manager.getActiveScreen()
  })

  const activeScreenId = createMemo(() => activeScreen()?.getId() ?? screens()[0]?.getId() ?? '')
  const hasSidebar = createMemo(() => screens().length > 1)

  return (
    <Show when={hasSidebar()}>
      <Sidebar
        screens={screens()}
        selectedIndex={props.manager.selectedIndex}
        activeScreenId={activeScreenId()}
        focused={props.manager.focusArea === 'sidebar'}
        width={props.width}
        title={props.title}
      />
    </Show>
  )
}
