import { CONTENT_MANAGER_EVENTS, FilterEngine, SCREEN_EVENTS } from '@navios/commander-tui'
import {
  createSignal,
  createEffect,
  createMemo,
  onCleanup,
  Show,
  untrack,
  type Accessor,
} from 'solid-js'

import type { ScreenInstance, ScreenManagerInstance } from '@navios/commander-tui'

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

  // Capture manager reference once to avoid reactive dependency on props
  const manager = untrack(() => props.manager)

  // Subscribe to manager events that affect content area
  // Wrap in createEffect to ensure proper cleanup on re-runs
  createEffect(() => {
    const handleManagerUpdate = () => setVersion((v) => v + 1)

    for (const event of CONTENT_MANAGER_EVENTS) {
      manager.on(event, handleManagerUpdate)
    }

    onCleanup(() => {
      for (const event of CONTENT_MANAGER_EVENTS) {
        manager.off(event, handleManagerUpdate)
      }
    })
  })

  const activeScreen = () => {
    version() // Track for reactivity
    return props.manager.getActiveScreen()
  }

  // Subscribe to active screen events for level counts calculation
  // This effect should only re-run when activeScreen changes (via version signal)
  createEffect(() => {
    version()
    // Only track version to know when active screen changes
    const screen = manager.getActiveScreen()
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
        <ScreenBridge screen={activeScreen as Accessor<ScreenInstance>} focused={focused()} />
      </Show>
    </box>
  )
}
