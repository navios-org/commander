import { Box, useInput } from 'ink'
import { useState, useCallback, useMemo, useSyncExternalStore } from 'react'

import { LoggerProvider } from '../context/index.ts'
import { useManagerSubscription, useFilterState, useKeyboardManager } from '../../react-shared/index.ts'
import { FilterEngine } from '../../../filter/index.ts'
import {
  hasActiveFilter,
  type Theme,
} from '../../../types/index.ts'

import type { ScreenManagerInstance } from '../../../services/index.ts'

import { FilterBar } from './filter/filter_bar.tsx'
import { HelpOverlay } from './help/help_overlay.tsx'
import { ScreenBridge } from './screen/screen_bridge.tsx'
import { Sidebar } from './sidebar/sidebar.tsx'

export interface ScreenManagerBridgeProps {
  manager: ScreenManagerInstance
  theme?: Theme
}

/**
 * Maps Ink's key format to the normalized format expected by KeyboardManager.
 */
function mapInkKeyToName(
  key: {
    upArrow?: boolean
    downArrow?: boolean
    leftArrow?: boolean
    rightArrow?: boolean
    return?: boolean
    escape?: boolean
    backspace?: boolean
    delete?: boolean
    tab?: boolean
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
  },
  input: string,
): string {
  if (key.upArrow) return 'up'
  if (key.downArrow) return 'down'
  if (key.leftArrow) return 'left'
  if (key.rightArrow) return 'right'
  if (key.return) return 'return'
  if (key.escape) return 'escape'
  if (key.backspace) return 'backspace'
  if (key.delete) return 'delete'
  if (key.tab) return 'tab'

  // For regular characters
  return input
}

export function ScreenManagerBridge({ manager, theme }: ScreenManagerBridgeProps) {
  // Subscribe to manager changes
  useManagerSubscription(manager)

  const [showHelp, setShowHelp] = useState(false)
  const [filter, filterActions] = useFilterState()

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev)
  }, [])

  // Create keyboard manager with bindings
  const { keyboardManager, handleKeyboard } = useKeyboardManager(
    {
      manager,
      toggleHelp,
      filterActions,
    },
    filter.isVisible,
    showHelp,
  )

  // Handle keyboard input using Ink's useInput
  useInput((input, key) => {
    const normalizedKey = {
      name: mapInkKeyToName(key, input),
      ctrl: key.ctrl,
      meta: key.meta,
      sequence: input,
    }

    handleKeyboard(normalizedKey)
  })

  const screens = manager.getScreens()
  const activeScreen = manager.getActiveScreen()
  const activeScreenId = activeScreen?.getId() ?? screens[0]?.getId() ?? ''
  const bindOptions = manager.getBindOptions()
  const hasSidebar = screens.length > 1

  const activeScreenVersion = useSyncExternalStore(
    (updater) => activeScreen?.onChange(updater) ?? (() => {}),
    () => activeScreen?.getVersion() ?? -1,
  )

  // Get level counts for filter bar
  const levelCounts = useMemo(() => {
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
  }, [activeScreenVersion, activeScreen])

  // Filter messages for the active screen
  const filteredMessages = useMemo(() => {
    if (!activeScreen) return []
    return FilterEngine.filterMessages(activeScreen.getMessages(), filter)
  }, [activeScreenVersion, activeScreen, filter])

  const isFiltering = useMemo(() => hasActiveFilter(filter), [filter])

  return (
    <LoggerProvider theme={theme}>
      <Box flexDirection="row" flexGrow={1}>
        {/* Sidebar */}
        {hasSidebar && (
          <Sidebar
            screens={screens}
            selectedIndex={manager.selectedIndex}
            activeScreenId={activeScreenId}
            focused={manager.focusArea === 'sidebar'}
            width={bindOptions.sidebarWidth ?? 25}
            title={bindOptions.sidebarTitle ?? 'Screens'}
          />
        )}

        {/* Main content area */}
        <Box flexDirection="column" flexGrow={1}>
          {/* Filter bar */}
          {filter.isVisible && <FilterBar filter={filter} levelCounts={levelCounts} />}

          {/* Screen content */}
          {activeScreen && (
            <ScreenBridge
              key={activeScreen.getId()}
              screen={activeScreen}
              focused={manager.focusArea === 'content'}
              filteredMessages={filteredMessages}
              isFiltering={isFiltering}
              totalMessages={activeScreen.getMessages().length}
            />
          )}
        </Box>

        {/* Help overlay */}
        {showHelp && <HelpOverlay bindings={keyboardManager.getBindingsForHelp()} />}
      </Box>
    </LoggerProvider>
  )
}
