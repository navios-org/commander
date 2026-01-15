import { Box, useInput } from 'ink'
import { useState, useCallback, useMemo } from 'react'

import { LoggerProvider } from '../context/index.ts'
import { KeyboardManager, createDefaultBindings, handlePrintableInput } from '@navios/commander-tui'
import type { KeyboardContext, Theme, ScreenManagerInstance } from '@navios/commander-tui'

import { ContentArea, FilterProvider, useFilter, useFilterActions } from './content/index.ts'
import { HelpOverlay } from './help/help_overlay.tsx'
import { SidebarContainer } from './sidebar/sidebar_container.tsx'

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

/**
 * Inner component that has access to filter context for keyboard handling.
 */
function ScreenManagerBridgeInner({ manager, theme }: ScreenManagerBridgeProps) {
  const [showHelp, setShowHelp] = useState(false)
  const filter = useFilter()
  const filterActions = useFilterActions()

  const bindOptions = manager.getBindOptions()

  // Helper functions for keyboard bindings
  const getActiveScreen = useCallback(() => manager.getActiveScreen(), [manager])

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev)
  }, [])

  // Create keyboard manager with bindings
  const keyboardManager = useMemo(() => {
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
  }, [manager, getActiveScreen, toggleHelp, filterActions])

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
        toggleFilter: filterActions.toggleFilter,
        closeFilter: filterActions.closeFilter,
        filterAppendChar: filterActions.filterAppendChar,
        filterDeleteChar: filterActions.filterDeleteChar,
        filterToggleLevel: filterActions.filterToggleLevel,
        filterCycleField: filterActions.filterCycleField,
      })
    },
    [manager, keyboardManager, filter.isVisible, showHelp, getActiveScreen, toggleHelp, filterActions],
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

  return (
    <LoggerProvider theme={theme}>
      <Box flexDirection="row" flexGrow={1}>
        {/* Sidebar - manages its own subscriptions */}
        <SidebarContainer
          manager={manager}
          width={bindOptions.sidebarWidth ?? 25}
          title={bindOptions.sidebarTitle ?? 'Screens'}
        />

        {/* Content area - manages its own subscriptions */}
        <ContentArea manager={manager} />

        {/* Help overlay */}
        {showHelp && <HelpOverlay bindings={keyboardManager.getBindingsForHelp()} />}
      </Box>
    </LoggerProvider>
  )
}

/**
 * Main bridge component that sets up filter context.
 * No manager subscriptions at this level - delegated to child components.
 */
export function ScreenManagerBridge({ manager, theme }: ScreenManagerBridgeProps) {
  return (
    <FilterProvider>
      <ScreenManagerBridgeInner manager={manager} theme={theme} />
    </FilterProvider>
  )
}
