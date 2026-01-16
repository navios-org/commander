import { FilterEngine } from '@navios/commander-tui'
import { Box } from 'ink'
import { useMemo } from 'react'

import type { ScreenManagerInstance } from '@navios/commander-tui'

import { useActiveScreen, useFocusArea, useScreenMessages } from '../../hooks/index.ts'
import { FilterBar } from '../filter/filter_bar.tsx'
import { ScreenBridge } from '../screen/screen_bridge.tsx'

import { useFilter } from './filter_context.tsx'

export interface ContentAreaProps {
  manager: ScreenManagerInstance
}

const EMPTY_LEVEL_COUNTS = {
  verbose: 0,
  debug: 0,
  log: 0,
  warn: 0,
  error: 0,
  fatal: 0,
}

/**
 * Container component for the main content area.
 * Uses useSyncExternalStore-based hooks for proper React 18 concurrent mode support.
 */
export function ContentArea({ manager }: ContentAreaProps) {
  const filter = useFilter()

  // Use granular hooks for specific state subscriptions
  const activeScreen = useActiveScreen(manager)
  const focusArea = useFocusArea(manager)

  // Get messages for level counts calculation
  const messages = useScreenMessages(activeScreen)

  // Get level counts for filter bar
  const levelCounts = useMemo(() => {
    if (!activeScreen) {
      return EMPTY_LEVEL_COUNTS
    }
    return FilterEngine.countByLevel(messages)
  }, [messages, activeScreen])

  const focused = focusArea === 'content'

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
