import { createSignal, createEffect, createMemo, onCleanup, Show } from 'solid-js'

import { CONTENT_MANAGER_EVENTS, FilterEngine, SCREEN_EVENTS } from '@navios/commander-tui'
import type { ScreenManagerInstance } from '@navios/commander-tui'

import { FilterBar } from '../filter/filter_bar.tsx'
import { ScreenBridge } from '../screen/screen_bridge.tsx'
import { useFilter } from './filter_context.tsx'

export interface ContentAreaProps {
  manager: ScreenManagerInstance
}

/**
 * Container component for the main content area.
 * Manages active screen subscriptions and filter bar rendering.
 * Filter state is provided via FilterContext.
 */
export function ContentArea(props: ContentAreaProps) {
  const [version, setVersion] = createSignal(0)
  const [screenVersion, setScreenVersion] = createSignal(0)
  const filter = useFilter()

  // Subscribe to manager events that affect content area
  createEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1)

    for (const event of CONTENT_MANAGER_EVENTS) {
      props.manager.on(event, handleUpdate)
    }

    onCleanup(() => {
      for (const event of CONTENT_MANAGER_EVENTS) {
        props.manager.off(event, handleUpdate)
      }
    })
  })

  const activeScreen = () => {
    version() // Track for reactivity
    return props.manager.getActiveScreen()
  }

  // Subscribe to active screen events for level counts calculation
  createEffect(() => {
    const screen = activeScreen()
    if (screen) {
      const handleScreenUpdate = () => setScreenVersion((v) => v + 1)

      for (const event of SCREEN_EVENTS) {
        screen.on(event, handleScreenUpdate)
      }

      onCleanup(() => {
        for (const event of SCREEN_EVENTS) {
          screen.off(event, handleScreenUpdate)
        }
      })
    }
  })

  // Get level counts for filter bar (depends on screen version)
  const levelCounts = createMemo(() => {
    screenVersion() // Track for reactivity
    const screen = activeScreen()
    if (!screen) {
      return {
        verbose: 0,
        debug: 0,
        log: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      }
    }
    return FilterEngine.countByLevel(screen.getMessages())
  })

  const focused = () => {
    version() // Track for reactivity
    return props.manager.focusArea === 'content'
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Filter bar */}
      <Show when={filter().isVisible}>
        <FilterBar filter={filter()} levelCounts={levelCounts()} />
      </Show>

      {/* Screen content */}
      <Show when={activeScreen()}>
        <ScreenBridge screen={activeScreen()!} focused={focused()} />
      </Show>
    </box>
  )
}
