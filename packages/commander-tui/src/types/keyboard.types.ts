import type { FocusArea } from './screen.types.ts'

// ============================================
// Keyboard Event Types
// ============================================

/**
 * Key event from the terminal.
 */
export interface KeyEvent {
  name: string
  sequence?: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
}

/**
 * Context available to keyboard handlers.
 */
export interface KeyboardContext {
  /** Has multiple screens (sidebar visible) */
  hasSidebar: boolean
  /** Currently focused area */
  focusArea: FocusArea
  /** Whether a prompt is active */
  hasPrompt: boolean
  /** Whether prompt is in text input mode */
  inInputMode: boolean
  /** Whether filter bar is visible */
  isFilterActive: boolean
  /** Whether help overlay is visible */
  isHelpVisible: boolean
}

/**
 * Handler function for a key binding.
 * Return true to prevent further processing, false/void to continue.
 */
export type KeyHandler = (key: KeyEvent, context: KeyboardContext) => boolean | void

/**
 * Category for organizing bindings in help overlay.
 */
export type KeyBindingCategory = 'general' | 'navigation' | 'screen' | 'prompt' | 'filter'

/**
 * Condition for when a binding is active.
 */
export interface KeyBindingCondition {
  hasPrompt?: boolean
  inInputMode?: boolean
  focusArea?: FocusArea
  isFilterActive?: boolean
  isHelpVisible?: boolean
  hasSidebar?: boolean
}

/**
 * A single key binding definition.
 */
export interface KeyBinding {
  /** Key name(s) that trigger this binding */
  key: string | string[]
  /** Require Ctrl modifier */
  ctrl?: boolean
  /** Require Meta/Cmd modifier */
  meta?: boolean
  /** Require Shift modifier (for capital letters) */
  shift?: boolean
  /** Handler function */
  handler: KeyHandler
  /** Description for help overlay */
  description: string
  /** Category for grouping in help */
  category: KeyBindingCategory
  /** Condition when this binding is active */
  when?: KeyBindingCondition
  /** Priority (higher = checked first, default 0) */
  priority?: number
}

/**
 * Configuration for the keyboard manager.
 */
export interface KeyBindingsConfig {
  /** Custom bindings (added to defaults) */
  bindings?: KeyBinding[]
  /** Override specific default bindings by key */
  overrides?: Record<string, Partial<KeyBinding>>
  /** Disable specific keys */
  disabled?: string[]
}
