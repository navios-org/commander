import type {
  KeyBinding,
  KeyBindingCategory,
  KeyBindingsConfig,
  KeyboardContext,
  KeyEvent,
} from '../types/index.ts'

/**
 * Manages keyboard bindings and dispatches key events to handlers.
 */
export class KeyboardManager {
  private bindings: KeyBinding[] = []
  private disabled: Set<string> = new Set()

  constructor(config?: KeyBindingsConfig) {
    if (config?.bindings) {
      this.bindings = [...config.bindings]
    }

    if (config?.disabled) {
      this.disabled = new Set(config.disabled)
    }

    // Sort bindings by priority (higher first)
    this.sortBindings()
  }

  /**
   * Add bindings to the manager.
   */
  addBindings(bindings: KeyBinding[]): void {
    this.bindings.push(...bindings)
    this.sortBindings()
  }

  /**
   * Remove a binding by key name.
   */
  removeBinding(key: string): void {
    this.bindings = this.bindings.filter((b) => {
      const keys = Array.isArray(b.key) ? b.key : [b.key]
      return !keys.includes(key)
    })
  }

  /**
   * Disable a key (prevents it from being matched).
   */
  disableKey(key: string): void {
    this.disabled.add(key)
  }

  /**
   * Enable a previously disabled key.
   */
  enableKey(key: string): void {
    this.disabled.delete(key)
  }

  /**
   * Handle a key event, dispatching to the appropriate handler.
   * Returns true if a handler consumed the event.
   */
  handleKey(key: KeyEvent, context: KeyboardContext): boolean {
    const binding = this.findMatchingBinding(key, context)
    if (binding) {
      const result = binding.handler(key, context)
      return result !== false
    }
    return false
  }

  /**
   * Get all bindings for display in help overlay.
   */
  getBindingsForHelp(): KeyBinding[] {
    return this.bindings.filter((b) => b.description)
  }

  /**
   * Get bindings grouped by category.
   */
  getBindingsByCategory(): Record<KeyBindingCategory, KeyBinding[]> {
    const grouped: Record<KeyBindingCategory, KeyBinding[]> = {
      general: [],
      navigation: [],
      screen: [],
      prompt: [],
      filter: [],
    }

    for (const binding of this.bindings) {
      if (binding.description) {
        grouped[binding.category].push(binding)
      }
    }

    return grouped
  }

  /**
   * Find a matching binding for the given key and context.
   */
  private findMatchingBinding(key: KeyEvent, context: KeyboardContext): KeyBinding | null {
    for (const binding of this.bindings) {
      if (
        this.keyMatches(key, binding) &&
        this.conditionMatches(binding.when, context) &&
        !this.isDisabled(binding)
      ) {
        return binding
      }
    }
    return null
  }

  /**
   * Check if a key event matches a binding's key specification.
   */
  private keyMatches(key: KeyEvent, binding: KeyBinding): boolean {
    const keys = Array.isArray(binding.key) ? binding.key : [binding.key]

    // Check key name or sequence
    const keyMatches = keys.includes(key.name) || (key.sequence && keys.includes(key.sequence))

    if (!keyMatches) return false

    // Check modifiers
    const ctrlMatches = (binding.ctrl ?? false) === (key.ctrl ?? false)
    const metaMatches = (binding.meta ?? false) === (key.meta ?? false)
    const shiftMatches = (binding.shift ?? false) === (key.shift ?? false)

    return ctrlMatches && metaMatches && shiftMatches
  }

  /**
   * Check if context matches a binding's condition.
   */
  private conditionMatches(condition: KeyBinding['when'], context: KeyboardContext): boolean {
    if (!condition) return true

    if (condition.hasPrompt !== undefined && condition.hasPrompt !== context.hasPrompt) {
      return false
    }

    if (condition.inInputMode !== undefined && condition.inInputMode !== context.inInputMode) {
      return false
    }

    if (condition.focusArea !== undefined && condition.focusArea !== context.focusArea) {
      return false
    }

    if (
      condition.isFilterActive !== undefined &&
      condition.isFilterActive !== context.isFilterActive
    ) {
      return false
    }

    if (
      condition.isHelpVisible !== undefined &&
      condition.isHelpVisible !== context.isHelpVisible
    ) {
      return false
    }

    if (condition.hasSidebar !== undefined && condition.hasSidebar !== context.hasSidebar) {
      return false
    }

    return true
  }

  /**
   * Check if a binding is disabled.
   */
  private isDisabled(binding: KeyBinding): boolean {
    const keys = Array.isArray(binding.key) ? binding.key : [binding.key]
    return keys.some((k) => this.disabled.has(k))
  }

  /**
   * Sort bindings by priority (higher first).
   */
  private sortBindings(): void {
    this.bindings.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }
}

/**
 * Format a key binding for display.
 */
export function formatKeyBinding(binding: KeyBinding): string {
  const keys = Array.isArray(binding.key) ? binding.key : [binding.key]
  const parts: string[] = []

  if (binding.ctrl) parts.push('Ctrl')
  if (binding.meta) parts.push('Cmd')
  if (binding.shift) parts.push('Shift')

  // Format key names for display
  const keyDisplay = keys
    .map((k) => {
      switch (k) {
        case 'up':
          return '↑'
        case 'down':
          return '↓'
        case 'left':
          return '←'
        case 'right':
          return '→'
        case 'return':
          return 'Enter'
        case 'escape':
          return 'Esc'
        case 'space':
          return 'Space'
        case 'tab':
          return 'Tab'
        case '\\':
          return '\\'
        default:
          return k
      }
    })
    .join('/')

  parts.push(keyDisplay)
  return parts.join('+')
}
