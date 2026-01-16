import { KeyboardManager, createDefaultBindings, handlePrintableInput } from '@navios/commander-tui'
import { useKeyboard } from '@opentui/solid'
import { createSignal, createMemo, Show, untrack } from 'solid-js'

import type { KeyboardContext, Theme, ScreenManagerInstance } from '@navios/commander-tui'

import { LoggerProvider } from '../context/index.ts'

import { ContentArea, FilterProvider, useFilter, useFilterActions } from './content/index.ts'
import { HelpOverlay } from './help/help_overlay.tsx'
import { SidebarContainer } from './sidebar/sidebar_container.tsx'

export interface ScreenManagerBridgeProps {
  manager: ScreenManagerInstance
  theme?: Theme
}

/**
 * Inner component that has access to filter context for keyboard handling.
 */
function ScreenManagerBridgeInner(props: ScreenManagerBridgeProps) {
  const [showHelp, setShowHelp] = createSignal(false)
  const filter = useFilter()
  const filterActions = useFilterActions()

  // Capture manager reference once to avoid reactive tracking
  const manager = untrack(() => props.manager)

  const bindOptions = () => manager.getBindOptions()

  // Helper functions for keyboard bindings
  const getActiveScreen = () => manager.getActiveScreen()

  const toggleHelp = () => {
    setShowHelp((prev) => !prev)
  }

  // Create keyboard manager with bindings - use captured manager to avoid re-creation
  const keyboardManager = createMemo(() => {
    const km = new KeyboardManager()
    const bindings = createDefaultBindings({
      manager,
      getActiveScreen,
      toggleHelp,
      toggleFilter: filterActions.toggleFilter,
      closeFilter: filterActions.closeFilter,
      filterAppendChar: filterActions.filterAppendChar,
      filterDeleteChar: filterActions.filterDeleteChar,
      filterToggleLevel: filterActions.filterToggleLevel,
      filterCycleField: filterActions.filterCycleField,
    })
    km.addBindings(bindings)
    return km
  })

  // Keyboard handler
  const handleKeyboard = (key: {
    name: string
    ctrl?: boolean
    meta?: boolean
    sequence?: string
  }) => {
    const screens = manager.getScreens()
    const activeScreen = manager.getActiveScreen()

    const context: KeyboardContext = {
      hasSidebar: screens.length > 1,
      focusArea: manager.focusArea,
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
      manager,
      getActiveScreen,
      toggleHelp,
      toggleFilter: filterActions.toggleFilter,
      closeFilter: filterActions.closeFilter,
      filterAppendChar: filterActions.filterAppendChar,
      filterDeleteChar: filterActions.filterDeleteChar,
      filterToggleLevel: filterActions.filterToggleLevel,
      filterCycleField: filterActions.filterCycleField,
    })
  }

  // Handle keyboard input
  useKeyboard(handleKeyboard)

  return (
    <LoggerProvider theme={props.theme}>
      <box flexDirection="row" flexGrow={1}>
        {/* Sidebar - manages its own subscriptions */}
        <SidebarContainer
          manager={manager}
          width={bindOptions().sidebarWidth ?? 25}
          title={bindOptions().sidebarTitle ?? 'Screens'}
        />

        {/* Content area - manages its own subscriptions */}
        <ContentArea manager={manager} />

        {/* Help overlay */}
        <Show when={showHelp()}>
          <HelpOverlay bindings={keyboardManager().getBindingsForHelp()} />
        </Show>
      </box>
    </LoggerProvider>
  )
}

/**
 * Main bridge component that sets up filter context.
 * No manager subscriptions at this level - delegated to child components.
 */
export function ScreenManagerBridge(props: ScreenManagerBridgeProps) {
  return (
    <FilterProvider>
      <ScreenManagerBridgeInner manager={props.manager} theme={props.theme} />
    </FilterProvider>
  )
}
