import type { ScreenInstance, ScreenManagerInstance } from '../services/index.ts'
import type { KeyBinding, KeyboardContext, KeyEvent } from '../types/index.ts'

/**
 * Interface for binding handlers that need manager/screen access.
 */
export interface BindingHandlers {
  manager: ScreenManagerInstance
  getActiveScreen: () => ScreenInstance | null
  toggleHelp: () => void
  toggleFilter: () => void
  closeFilter: () => void
  filterAppendChar: (char: string) => void
  filterDeleteChar: () => void
  filterToggleLevel: (index: number) => void
  filterCycleField: () => void
}

/**
 * Create the default keybindings with access to manager and screens.
 */
export function createDefaultBindings(handlers: BindingHandlers): KeyBinding[] {
  const { manager, getActiveScreen, toggleHelp, toggleFilter, closeFilter } = handlers

  const bindings: KeyBinding[] = []

  // ============================================
  // PROMPT INPUT MODE (highest priority)
  // ============================================

  // Escape to exit input mode
  bindings.push({
    key: 'escape',
    handler: () => {
      const screen = getActiveScreen()
      if (screen?.isPromptInInputMode()) {
        screen.promptExitInputMode()
        return true
      }
    },
    description: 'Exit input mode',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: true },
    priority: 100,
  })

  // Enter to submit in input mode
  bindings.push({
    key: 'return',
    handler: () => {
      const screen = getActiveScreen()
      if (screen?.isPromptInInputMode()) {
        screen.promptSubmit()
        return true
      }
    },
    description: 'Submit input',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: true },
    priority: 100,
  })

  // Backspace to delete in input mode
  bindings.push({
    key: 'backspace',
    handler: () => {
      const screen = getActiveScreen()
      if (screen?.isPromptInInputMode()) {
        screen.promptDeleteLastChar()
        return true
      }
    },
    description: 'Delete character',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: true },
    priority: 100,
  })

  // ============================================
  // PROMPT NAVIGATION (high priority)
  // ============================================

  // Choice prompt: up/down to navigate, enter to select
  bindings.push({
    key: ['up', 'k'],
    handler: () => {
      const screen = getActiveScreen()
      const prompt = screen?.getActivePrompt()
      if (prompt?.type === 'choice' || prompt?.type === 'multiChoice') {
        screen?.promptNavigateUp()
        return true
      }
    },
    description: 'Navigate up',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: false },
    priority: 90,
  })

  bindings.push({
    key: ['down', 'j'],
    handler: () => {
      const screen = getActiveScreen()
      const prompt = screen?.getActivePrompt()
      if (prompt?.type === 'choice' || prompt?.type === 'multiChoice') {
        screen?.promptNavigateDown()
        return true
      }
    },
    description: 'Navigate down',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: false },
    priority: 90,
  })

  // Confirm prompt: left/right to toggle
  bindings.push({
    key: ['left', 'h'],
    handler: () => {
      const screen = getActiveScreen()
      const prompt = screen?.getActivePrompt()
      if (prompt?.type === 'confirm') {
        screen?.promptNavigateLeft()
        return true
      }
    },
    description: 'Select confirm',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: false },
    priority: 90,
  })

  bindings.push({
    key: ['right', 'l'],
    handler: () => {
      const screen = getActiveScreen()
      const prompt = screen?.getActivePrompt()
      if (prompt?.type === 'confirm') {
        screen?.promptNavigateRight()
        return true
      }
    },
    description: 'Select cancel',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: false },
    priority: 90,
  })

  // Space to toggle in multiChoice
  bindings.push({
    key: 'space',
    handler: () => {
      const screen = getActiveScreen()
      const prompt = screen?.getActivePrompt()
      if (prompt?.type === 'multiChoice') {
        screen?.promptToggleSelection()
        return true
      }
    },
    description: 'Toggle selection',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: false },
    priority: 90,
  })

  // Enter to submit prompt (or enter input mode for choice with input)
  bindings.push({
    key: 'return',
    handler: () => {
      const screen = getActiveScreen()
      const prompt = screen?.getActivePrompt()
      if (!prompt) return false

      if (prompt.type === 'choice') {
        const entered = screen?.promptEnterInputMode()
        if (!entered) {
          screen?.promptSubmit()
        }
        return true
      } else if (prompt.type === 'confirm') {
        screen?.promptSubmit()
        return true
      } else if (prompt.type === 'multiChoice') {
        if (screen?.canSubmitPrompt()) {
          screen.promptSubmit()
        }
        return true
      }
    },
    description: 'Submit selection',
    category: 'prompt',
    when: { hasPrompt: true, inInputMode: false },
    priority: 90,
  })

  // ============================================
  // HELP OVERLAY
  // ============================================

  bindings.push({
    key: '?',
    handler: () => {
      toggleHelp()
      return true
    },
    description: 'Toggle help',
    category: 'general',
    when: { hasPrompt: false, isFilterActive: false },
    priority: 50,
  })

  // Escape to close help
  bindings.push({
    key: 'escape',
    handler: () => {
      toggleHelp()
      return true
    },
    description: 'Close help',
    category: 'general',
    when: { isHelpVisible: true },
    priority: 80,
  })

  // ============================================
  // FILTER
  // ============================================

  bindings.push({
    key: '/',
    handler: () => {
      toggleFilter()
      return true
    },
    description: 'Toggle filter',
    category: 'filter',
    when: { hasPrompt: false, isHelpVisible: false },
    priority: 50,
  })

  // Escape to close filter
  bindings.push({
    key: 'escape',
    handler: () => {
      closeFilter()
      return true
    },
    description: 'Close filter',
    category: 'filter',
    when: { isFilterActive: true },
    priority: 70,
  })

  // Tab to cycle filter fields
  bindings.push({
    key: 'tab',
    handler: () => {
      handlers.filterCycleField()
      return true
    },
    description: 'Cycle filter fields',
    category: 'filter',
    when: { isFilterActive: true },
    priority: 70,
  })

  // Backspace in filter
  bindings.push({
    key: 'backspace',
    handler: () => {
      handlers.filterDeleteChar()
      return true
    },
    description: 'Delete character',
    category: 'filter',
    when: { isFilterActive: true },
    priority: 70,
  })

  // Number keys 1-7 to toggle log levels in filter
  for (let i = 1; i <= 7; i++) {
    bindings.push({
      key: String(i),
      handler: () => {
        handlers.filterToggleLevel(i - 1)
        return true
      },
      description: `Toggle level ${i}`,
      category: 'filter',
      when: { isFilterActive: true },
      priority: 70,
    })
  }

  // ============================================
  // GENERAL
  // ============================================

  bindings.push({
    key: 'q',
    handler: () => {
      manager.unbind()
      return true
    },
    description: 'Exit',
    category: 'general',
    when: { hasPrompt: false, isFilterActive: false, isHelpVisible: false },
    priority: 10,
  })

  // Tab to switch focus
  bindings.push({
    key: 'tab',
    handler: (_, ctx) => {
      if (ctx.hasSidebar) {
        manager.toggleFocus()
        return true
      }
    },
    description: 'Toggle focus',
    category: 'navigation',
    when: { hasPrompt: false, isFilterActive: false },
    priority: 20,
  })

  // Backslash to toggle focus (alternate)
  bindings.push({
    key: '\\',
    handler: (_, ctx) => {
      if (ctx.hasSidebar) {
        manager.toggleFocus()
        return true
      }
    },
    description: 'Toggle focus',
    category: 'navigation',
    when: { hasPrompt: false, isFilterActive: false },
    priority: 20,
  })

  // ============================================
  // SIDEBAR NAVIGATION
  // ============================================

  bindings.push({
    key: ['up', 'k'],
    handler: () => {
      manager.navigateUp()
      return true
    },
    description: 'Navigate up',
    category: 'navigation',
    when: { focusArea: 'sidebar', hasPrompt: false },
    priority: 30,
  })

  bindings.push({
    key: ['down', 'j'],
    handler: () => {
      manager.navigateDown()
      return true
    },
    description: 'Navigate down',
    category: 'navigation',
    when: { focusArea: 'sidebar', hasPrompt: false },
    priority: 30,
  })

  bindings.push({
    key: 'return',
    handler: () => {
      manager.selectCurrent()
      return true
    },
    description: 'Select screen',
    category: 'navigation',
    when: { focusArea: 'sidebar', hasPrompt: false },
    priority: 30,
  })

  // ============================================
  // SCREEN SHORTCUTS (1-9)
  // ============================================

  for (let i = 1; i <= 9; i++) {
    bindings.push({
      key: String(i),
      handler: () => {
        const screens = manager.getScreens()
        if (i <= screens.length) {
          manager.setActiveScreen(screens[i - 1]!)
          manager.setSelectedIndex(i - 1)
          return true
        }
      },
      description: `Jump to screen ${i}`,
      category: 'screen',
      when: { hasPrompt: false, isFilterActive: false },
      priority: 15,
    })
  }

  // ============================================
  // SCREEN ACTIONS
  // ============================================

  bindings.push({
    key: 'c',
    handler: () => {
      const screen = getActiveScreen()
      screen?.clear()
      return true
    },
    description: 'Clear screen',
    category: 'screen',
    when: { focusArea: 'content', hasPrompt: false, isFilterActive: false },
    priority: 15,
  })

  return bindings
}

/**
 * Handle printable character input for prompts and filter.
 * This should be called for any key not handled by bindings.
 */
export function handlePrintableInput(
  key: KeyEvent,
  context: KeyboardContext,
  handlers: BindingHandlers,
): boolean {
  // Only handle single printable characters without modifiers
  if (!key.sequence || key.sequence.length !== 1 || key.ctrl || key.meta) {
    return false
  }

  const charCode = key.sequence.charCodeAt(0)
  // Printable ASCII (space to tilde)
  if (charCode < 32 || charCode > 126) {
    return false
  }

  // Handle filter input
  if (context.isFilterActive) {
    handlers.filterAppendChar(key.sequence)
    return true
  }

  // Handle prompt input mode
  if (context.hasPrompt && context.inInputMode) {
    const screen = handlers.getActiveScreen()
    screen?.promptAppendInput(key.sequence)
    return true
  }

  return false
}
