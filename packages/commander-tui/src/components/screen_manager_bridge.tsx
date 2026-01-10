import { useKeyboard } from '@opentui/react'
import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react'

import { LoggerProvider } from '../context/index.ts'
import { FilterEngine } from '../filter/index.ts'
import { KeyboardManager, createDefaultBindings, handlePrintableInput } from '../keyboard/index.ts'
import {
  ALL_LOG_LEVELS,
  createDefaultFilterState,
  hasActiveFilter,
  type FilterState,
  type KeyboardContext,
  type Theme,
} from '../types/index.ts'

import type { ScreenManager } from '../services/index.ts'

import { FilterBar } from './filter/filter_bar.tsx'
import { HelpOverlay } from './help/help_overlay.tsx'
import { ScreenBridge } from './screen/screen_bridge.tsx'
import { Sidebar } from './sidebar/sidebar.tsx'

export interface ScreenManagerBridgeProps {
  manager: ScreenManager
  theme?: Theme
}

export function ScreenManagerBridge({ manager, theme }: ScreenManagerBridgeProps) {
  const [, forceUpdate] = useState({})
  const [showHelp, setShowHelp] = useState(false)
  const [filter, setFilter] = useState<FilterState>(createDefaultFilterState)

  // Subscribe to manager changes
  useEffect(() => {
    return manager.onChange(() => forceUpdate({}))
  }, [manager])

  // Helper functions for keyboard bindings
  const getActiveScreen = useCallback(() => manager.getActiveScreen(), [manager])

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev)
  }, [])

  const toggleFilter = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
      focusedField: 'search',
    }))
  }, [])

  const closeFilter = useCallback(() => {
    setFilter((prev) => ({ ...prev, isVisible: false }))
  }, [])

  const filterAppendChar = useCallback((char: string) => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery + char,
    }))
  }, [])

  const filterDeleteChar = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery.slice(0, -1),
    }))
  }, [])

  const filterToggleLevel = useCallback((index: number) => {
    setFilter((prev) => {
      const level = ALL_LOG_LEVELS[index]
      if (!level) return prev

      const newLevels = new Set(prev.enabledLevels)
      if (newLevels.has(level)) {
        newLevels.delete(level)
      } else {
        newLevels.add(level)
      }

      return { ...prev, enabledLevels: newLevels }
    })
  }, [])

  const filterCycleField = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      focusedField: prev.focusedField === 'search' ? 'levels' : 'search',
    }))
  }, [])

  // Create keyboard manager with bindings
  const keyboardManager = useMemo(() => {
    const km = new KeyboardManager()
    const bindings = createDefaultBindings({
      manager,
      getActiveScreen,
      toggleHelp,
      toggleFilter,
      closeFilter,
      filterAppendChar,
      filterDeleteChar,
      filterToggleLevel,
      filterCycleField,
    })
    km.addBindings(bindings)
    return km
  }, [
    manager,
    getActiveScreen,
    toggleHelp,
    toggleFilter,
    closeFilter,
    filterAppendChar,
    filterDeleteChar,
    filterToggleLevel,
    filterCycleField,
  ])

  // Keyboard handler
  const handleKeyboard = useCallback(
    (key: { name: string; ctrl?: boolean; meta?: boolean; sequence?: string }) => {
      const screens = manager.getScreens()
      const activeScreen = manager.getActiveScreen()

      const context: KeyboardContext = {
        hasSidebar: screens.length > 1,
        focusArea: manager.focusArea,
        hasPrompt: activeScreen?.hasActivePrompt() ?? false,
        inInputMode: activeScreen?.isPromptInInputMode() ?? false,
        isFilterActive: filter.isVisible,
        isHelpVisible: showHelp,
      }

      // Try keyboard manager first
      if (keyboardManager.handleKey(key, context)) {
        return
      }

      // Handle printable characters (for input mode and filter)
      handlePrintableInput(key, context, {
        manager,
        getActiveScreen,
        toggleHelp,
        toggleFilter,
        closeFilter,
        filterAppendChar,
        filterDeleteChar,
        filterToggleLevel,
        filterCycleField,
      })
    },
    [
      manager,
      keyboardManager,
      filter.isVisible,
      showHelp,
      getActiveScreen,
      toggleHelp,
      toggleFilter,
      closeFilter,
      filterAppendChar,
      filterDeleteChar,
      filterToggleLevel,
      filterCycleField,
    ],
  )

  // Handle keyboard input
  useKeyboard(handleKeyboard)

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
      <box flexDirection="row" flexGrow={1}>
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
        <box flexDirection="column" flexGrow={1}>
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
        </box>

        {/* Help overlay */}
        {showHelp && <HelpOverlay bindings={keyboardManager.getBindingsForHelp()} />}
      </box>
    </LoggerProvider>
  )
}
