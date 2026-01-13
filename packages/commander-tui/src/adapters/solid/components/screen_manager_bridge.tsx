import { useKeyboard } from '@opentui/solid'
import { createSignal, createEffect, createMemo, onCleanup, Show } from 'solid-js'

import { LoggerProvider } from '../context/index.ts'
import { FilterEngine } from '../../../filter/index.ts'
import { KeyboardManager, createDefaultBindings, handlePrintableInput } from '../../../keyboard/index.ts'
import {
  ALL_LOG_LEVELS,
  createDefaultFilterState,
  hasActiveFilter,
  type FilterState,
  type KeyboardContext,
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

export function ScreenManagerBridge(props: ScreenManagerBridgeProps) {
  const [version, setVersion] = createSignal(0)
  const [showHelp, setShowHelp] = createSignal(false)
  const [filter, setFilter] = createSignal<FilterState>(createDefaultFilterState())

  // Subscribe to manager changes
  createEffect(() => {
    const unsub = props.manager.onChange(() => setVersion((v) => v + 1))
    onCleanup(() => unsub())
  })

  // Helper functions for keyboard bindings
  const getActiveScreen = () => props.manager.getActiveScreen()

  const toggleHelp = () => {
    setShowHelp((prev) => !prev)
  }

  const toggleFilter = () => {
    setFilter((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
      focusedField: 'search',
    }))
  }

  const closeFilter = () => {
    setFilter((prev) => ({ ...prev, isVisible: false }))
  }

  const filterAppendChar = (char: string) => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery + char,
    }))
  }

  const filterDeleteChar = () => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery.slice(0, -1),
    }))
  }

  const filterToggleLevel = (index: number) => {
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
  }

  const filterCycleField = () => {
    setFilter((prev) => ({
      ...prev,
      focusedField: prev.focusedField === 'search' ? 'levels' : 'search',
    }))
  }

  // Create keyboard manager with bindings
  const keyboardManager = createMemo(() => {
    const km = new KeyboardManager()
    const bindings = createDefaultBindings({
      manager: props.manager,
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
  })

  // Keyboard handler
  const handleKeyboard = (key: { name: string; ctrl?: boolean; meta?: boolean; sequence?: string }) => {
    const screens = props.manager.getScreens()
    const activeScreen = props.manager.getActiveScreen()

    const context: KeyboardContext = {
      hasSidebar: screens.length > 1,
      focusArea: props.manager.focusArea,
      hasPrompt: activeScreen?.hasActivePrompt() ?? false,
      inInputMode: activeScreen?.isPromptInInputMode() ?? false,
      isFilterActive: filter().isVisible,
      isHelpVisible: showHelp(),
    }

    // Try keyboard manager first
    if (keyboardManager().handleKey(key, context)) {
      return
    }

    // Handle printable characters (for input mode and filter)
    handlePrintableInput(key, context, {
      manager: props.manager,
      getActiveScreen,
      toggleHelp,
      toggleFilter,
      closeFilter,
      filterAppendChar,
      filterDeleteChar,
      filterToggleLevel,
      filterCycleField,
    })
  }

  // Handle keyboard input
  useKeyboard(handleKeyboard)

  // Derived state
  const screens = () => {
    version() // Track for reactivity
    return props.manager.getScreens()
  }

  const activeScreen = () => {
    version() // Track for reactivity
    return props.manager.getActiveScreen()
  }

  const activeScreenId = () => activeScreen()?.getId() ?? screens()[0]?.getId() ?? ''
  const bindOptions = () => props.manager.getBindOptions()
  const hasSidebar = () => screens().length > 1

  // Subscribe to active screen version for level counts
  const [activeScreenVersion, setActiveScreenVersion] = createSignal(0)

  createEffect(() => {
    const screen = activeScreen()
    if (screen) {
      const unsub = screen.onChange(() => setActiveScreenVersion((v) => v + 1))
      onCleanup(() => unsub())
    }
  })

  // Get level counts for filter bar
  const levelCounts = createMemo(() => {
    activeScreenVersion() // Track for reactivity
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

  // Filter messages for the active screen
  const filteredMessages = createMemo(() => {
    activeScreenVersion() // Track for reactivity
    const screen = activeScreen()
    if (!screen) return []
    return FilterEngine.filterMessages(screen.getMessages(), filter())
  })

  const isFiltering = createMemo(() => hasActiveFilter(filter()))

  return (
    <LoggerProvider theme={props.theme}>
      <box flexDirection="row" flexGrow={1}>
        {/* Sidebar */}
        <Show when={hasSidebar()}>
          <Sidebar
            screens={screens()}
            selectedIndex={props.manager.selectedIndex}
            activeScreenId={activeScreenId()}
            focused={props.manager.focusArea === 'sidebar'}
            width={bindOptions().sidebarWidth ?? 25}
            title={bindOptions().sidebarTitle ?? 'Screens'}
          />
        </Show>

        {/* Main content area */}
        <box flexDirection="column" flexGrow={1}>
          {/* Filter bar */}
          <Show when={filter().isVisible}>
            <FilterBar filter={filter()} levelCounts={levelCounts()} />
          </Show>

          {/* Screen content */}
          <Show when={activeScreen()}>
            <ScreenBridge
              screen={activeScreen()!}
              focused={props.manager.focusArea === 'content'}
              filteredMessages={filteredMessages()}
              isFiltering={isFiltering()}
              totalMessages={activeScreen()!.getMessages().length}
            />
          </Show>
        </box>

        {/* Help overlay */}
        <Show when={showHelp()}>
          <HelpOverlay bindings={keyboardManager().getBindingsForHelp()} />
        </Show>
      </box>
    </LoggerProvider>
  )
}
