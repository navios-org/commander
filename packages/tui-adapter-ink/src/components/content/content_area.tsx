import { CONTENT_MANAGER_EVENTS, FilterEngine, SCREEN_EVENTS } from '@navios/commander-tui'
import { Box } from 'ink'
import { useState, useEffect, useMemo } from 'react'

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
export function ContentArea({ manager }: ContentAreaProps) {
  const [, forceUpdate] = useState({})
  const [screenVersion, setScreenVersion] = useState(0)
  const filter = useFilter()

  // Subscribe to manager events that affect content area
  useEffect(() => {
    const handleUpdate = () => forceUpdate({})

    for (const event of CONTENT_MANAGER_EVENTS) {
      manager.on(event, handleUpdate)
    }

    return () => {
      for (const event of CONTENT_MANAGER_EVENTS) {
        manager.off(event, handleUpdate)
      }
    }
  }, [manager])

  const activeScreen = manager.getActiveScreen()

  // Subscribe to active screen events for level counts calculation
  useEffect(() => {
    if (!activeScreen) return

    const handleScreenUpdate = () => setScreenVersion((v) => v + 1)

    for (const event of SCREEN_EVENTS) {
      activeScreen.on(event, handleScreenUpdate)
    }

    return () => {
      for (const event of SCREEN_EVENTS) {
        activeScreen.off(event, handleScreenUpdate)
      }
    }
  }, [activeScreen])

  // Get level counts for filter bar (depends on screen version)
  const levelCounts = useMemo(() => {
    // Reference screenVersion to ensure recalculation
    void screenVersion
    if (!activeScreen) {
      return {
        verbose: 0,
        debug: 0,
        log: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      }
    }
    return FilterEngine.countByLevel(activeScreen.getMessages())
  }, [screenVersion, activeScreen])

  const focused = manager.focusArea === 'content'

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Filter bar */}
      {filter.isVisible && <FilterBar filter={filter} levelCounts={levelCounts} />}

      {/* Screen content */}
      {activeScreen && (
        <ScreenBridge key={activeScreen.getId()} screen={activeScreen} focused={focused} />
      )}
    </Box>
  )
}
