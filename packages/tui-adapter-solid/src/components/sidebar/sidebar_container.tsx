import { createSignal, createEffect, onCleanup, Show } from 'solid-js'

import { SIDEBAR_EVENTS } from '@navios/commander-tui'
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

  // Subscribe only to events that affect sidebar rendering
  createEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1)

    for (const event of SIDEBAR_EVENTS) {
      props.manager.on(event, handleUpdate)
    }

    onCleanup(() => {
      for (const event of SIDEBAR_EVENTS) {
        props.manager.off(event, handleUpdate)
      }
    })
  })

  // Derive sidebar state from manager
  const screens = () => {
    version() // Track for reactivity
    return props.manager.getScreens()
  }

  const activeScreen = () => {
    version() // Track for reactivity
    return props.manager.getActiveScreen()
  }

  const activeScreenId = () => activeScreen()?.getId() ?? screens()[0]?.getId() ?? ''
  const hasSidebar = () => screens().length > 1

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
