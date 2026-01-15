import { useMemo, useCallback } from 'react'

import { KeyboardManager, createDefaultBindings, handlePrintableInput } from '@navios/commander-tui'
import type { KeyboardContext, ScreenManagerInstance } from '@navios/commander-tui'

import type { FilterStateActions } from './use_filter_state.ts'

export interface UseKeyboardManagerOptions {
  manager: ScreenManagerInstance
  toggleHelp: () => void
  filterActions: FilterStateActions
}

export interface KeyboardHandler {
  (key: { name: string; ctrl?: boolean; meta?: boolean; sequence?: string }): void
}

export interface UseKeyboardManagerResult {
  keyboardManager: KeyboardManager
  handleKeyboard: KeyboardHandler
}

/**
 * Hook to create and manage the KeyboardManager with default bindings.
 * Returns a keyboard manager instance and a handler function.
 */
export function useKeyboardManager(
  options: UseKeyboardManagerOptions,
  filterIsVisible: boolean,
  showHelp: boolean,
): UseKeyboardManagerResult {
  const { manager, toggleHelp, filterActions } = options
  const {
    toggleFilter,
    closeFilter,
    filterAppendChar,
    filterDeleteChar,
    filterToggleLevel,
    filterCycleField,
  } = filterActions

  const getActiveScreen = useCallback(() => manager.getActiveScreen(), [manager])

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
        isFilterActive: filterIsVisible,
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
      filterIsVisible,
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

  return { keyboardManager, handleKeyboard }
}
