import { beforeEach, describe, expect, it, vi } from 'vitest'

import { formatKeyBinding, KeyboardManager } from '../../keyboard/keyboard_manager.ts'
import { createKeyboardContext } from '../utils/factories.ts'

import type { KeyBinding } from '../../types/index.ts'

describe('KeyboardManager', () => {
  let manager: KeyboardManager

  const createBinding = (overrides: Partial<KeyBinding> = {}): KeyBinding => ({
    key: 'a',
    handler: vi.fn(() => true),
    description: 'Test binding',
    category: 'general',
    ...overrides,
  })

  beforeEach(() => {
    manager = new KeyboardManager()
  })

  describe('construction', () => {
    it('should create with empty bindings', () => {
      const mgr = new KeyboardManager()
      expect(mgr.getBindingsForHelp()).toHaveLength(0)
    })

    it('should create with initial bindings sorted by priority', () => {
      const binding1 = createBinding({ key: 'a', priority: 1 })
      const binding2 = createBinding({ key: 'b', priority: 10 })
      const binding3 = createBinding({ key: 'c', priority: 5 })

      const mgr = new KeyboardManager({
        bindings: [binding1, binding2, binding3],
      })

      const bindings = mgr.getBindingsForHelp()
      expect(bindings[0].key).toBe('b') // priority 10
      expect(bindings[1].key).toBe('c') // priority 5
      expect(bindings[2].key).toBe('a') // priority 1
    })

    it('should create with disabled keys', () => {
      const binding = createBinding({ key: 'a' })
      const mgr = new KeyboardManager({
        bindings: [binding],
        disabled: ['a'],
      })

      const context = createKeyboardContext()
      const result = mgr.handleKey({ name: 'a' }, context)

      expect(result).toBe(false)
      expect(binding.handler).not.toHaveBeenCalled()
    })
  })

  describe('addBindings', () => {
    it('should add bindings and re-sort by priority', () => {
      const existing = createBinding({ key: 'a', priority: 5 })
      manager.addBindings([existing])

      const newBinding = createBinding({ key: 'b', priority: 10 })
      manager.addBindings([newBinding])

      const bindings = manager.getBindingsForHelp()
      expect(bindings[0].key).toBe('b') // Higher priority first
      expect(bindings[1].key).toBe('a')
    })
  })

  describe('removeBinding', () => {
    it('should remove binding by key name', () => {
      const binding = createBinding({ key: 'a' })
      manager.addBindings([binding])

      expect(manager.getBindingsForHelp()).toHaveLength(1)

      manager.removeBinding('a')

      expect(manager.getBindingsForHelp()).toHaveLength(0)
    })

    it('should remove binding with multiple keys (array)', () => {
      const binding = createBinding({ key: ['a', 'b', 'c'] })
      manager.addBindings([binding])

      manager.removeBinding('b')

      expect(manager.getBindingsForHelp()).toHaveLength(0)
    })

    it('should do nothing if key not found', () => {
      const binding = createBinding({ key: 'a' })
      manager.addBindings([binding])

      manager.removeBinding('z')

      expect(manager.getBindingsForHelp()).toHaveLength(1)
    })
  })

  describe('disableKey / enableKey', () => {
    it('should prevent disabled key from being matched', () => {
      const binding = createBinding({ key: 'a' })
      manager.addBindings([binding])

      manager.disableKey('a')

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'a' }, context)

      expect(result).toBe(false)
      expect(binding.handler).not.toHaveBeenCalled()
    })

    it('should allow re-enabled key to be matched again', () => {
      const binding = createBinding({ key: 'a' })
      manager.addBindings([binding])

      manager.disableKey('a')
      manager.enableKey('a')

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'a' }, context)

      expect(result).toBe(true)
      expect(binding.handler).toHaveBeenCalled()
    })
  })

  describe('handleKey', () => {
    it('should match key by name', () => {
      const binding = createBinding({ key: 'enter' })
      manager.addBindings([binding])

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'enter' }, context)

      expect(result).toBe(true)
      expect(binding.handler).toHaveBeenCalled()
    })

    it('should match key by sequence', () => {
      const binding = createBinding({ key: '\x1b[A' }) // Up arrow sequence
      manager.addBindings([binding])

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'up', sequence: '\x1b[A' }, context)

      expect(result).toBe(true)
      expect(binding.handler).toHaveBeenCalled()
    })

    it('should respect ctrl modifier', () => {
      const bindingWithCtrl = createBinding({ key: 'c', ctrl: true })
      const bindingWithoutCtrl = createBinding({ key: 'c', ctrl: false })
      manager.addBindings([bindingWithCtrl, bindingWithoutCtrl])

      const context = createKeyboardContext()

      // Should match binding with ctrl when ctrl is pressed
      manager.handleKey({ name: 'c', ctrl: true }, context)
      expect(bindingWithCtrl.handler).toHaveBeenCalled()
      expect(bindingWithoutCtrl.handler).not.toHaveBeenCalled()
    })

    it('should respect meta modifier', () => {
      const binding = createBinding({ key: 's', meta: true })
      manager.addBindings([binding])

      const context = createKeyboardContext()

      // Without meta - should not match
      let result = manager.handleKey({ name: 's', meta: false }, context)
      expect(result).toBe(false)

      // With meta - should match
      result = manager.handleKey({ name: 's', meta: true }, context)
      expect(result).toBe(true)
    })

    it('should respect shift modifier', () => {
      const binding = createBinding({ key: 'tab', shift: true })
      manager.addBindings([binding])

      const context = createKeyboardContext()

      // Without shift - should not match
      let result = manager.handleKey({ name: 'tab', shift: false }, context)
      expect(result).toBe(false)

      // With shift - should match
      result = manager.handleKey({ name: 'tab', shift: true }, context)
      expect(result).toBe(true)
    })

    it('should return true when handler consumed event', () => {
      const binding = createBinding({
        key: 'a',
        handler: vi.fn(() => true),
      })
      manager.addBindings([binding])

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'a' }, context)

      expect(result).toBe(true)
    })

    it('should return false when handler returns false', () => {
      const binding = createBinding({
        key: 'a',
        handler: vi.fn(() => false),
      })
      manager.addBindings([binding])

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'a' }, context)

      expect(result).toBe(false)
    })

    it('should return false when no binding matches', () => {
      const binding = createBinding({ key: 'a' })
      manager.addBindings([binding])

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'z' }, context)

      expect(result).toBe(false)
    })

    it('should match binding with multiple keys', () => {
      const binding = createBinding({ key: ['up', 'k'] })
      manager.addBindings([binding])

      const context = createKeyboardContext()

      manager.handleKey({ name: 'up' }, context)
      expect(binding.handler).toHaveBeenCalledTimes(1)

      manager.handleKey({ name: 'k' }, context)
      expect(binding.handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('condition matching', () => {
    it('should match hasPrompt condition', () => {
      const binding = createBinding({
        key: 'enter',
        when: { hasPrompt: true },
      })
      manager.addBindings([binding])

      // Without prompt - should not match
      let result = manager.handleKey({ name: 'enter' }, createKeyboardContext({ hasPrompt: false }))
      expect(result).toBe(false)

      // With prompt - should match
      result = manager.handleKey({ name: 'enter' }, createKeyboardContext({ hasPrompt: true }))
      expect(result).toBe(true)
    })

    it('should match inInputMode condition', () => {
      const binding = createBinding({
        key: 'backspace',
        when: { inInputMode: true },
      })
      manager.addBindings([binding])

      // Not in input mode - should not match
      let result = manager.handleKey(
        { name: 'backspace' },
        createKeyboardContext({ inInputMode: false }),
      )
      expect(result).toBe(false)

      // In input mode - should match
      result = manager.handleKey(
        { name: 'backspace' },
        createKeyboardContext({ inInputMode: true }),
      )
      expect(result).toBe(true)
    })

    it('should match focusArea condition', () => {
      const binding = createBinding({
        key: 'enter',
        when: { focusArea: 'sidebar' },
      })
      manager.addBindings([binding])

      // Wrong focus area - should not match
      let result = manager.handleKey(
        { name: 'enter' },
        createKeyboardContext({ focusArea: 'content' }),
      )
      expect(result).toBe(false)

      // Correct focus area - should match
      result = manager.handleKey({ name: 'enter' }, createKeyboardContext({ focusArea: 'sidebar' }))
      expect(result).toBe(true)
    })

    it('should match isFilterActive condition', () => {
      const binding = createBinding({
        key: 'escape',
        when: { isFilterActive: true },
      })
      manager.addBindings([binding])

      // Filter not active - should not match
      let result = manager.handleKey(
        { name: 'escape' },
        createKeyboardContext({ isFilterActive: false }),
      )
      expect(result).toBe(false)

      // Filter active - should match
      result = manager.handleKey(
        { name: 'escape' },
        createKeyboardContext({ isFilterActive: true }),
      )
      expect(result).toBe(true)
    })

    it('should match isHelpVisible condition', () => {
      const binding = createBinding({
        key: 'escape',
        when: { isHelpVisible: true },
      })
      manager.addBindings([binding])

      // Help not visible - should not match
      let result = manager.handleKey(
        { name: 'escape' },
        createKeyboardContext({ isHelpVisible: false }),
      )
      expect(result).toBe(false)

      // Help visible - should match
      result = manager.handleKey({ name: 'escape' }, createKeyboardContext({ isHelpVisible: true }))
      expect(result).toBe(true)
    })

    it('should match hasSidebar condition', () => {
      const binding = createBinding({
        key: 'tab',
        when: { hasSidebar: true },
      })
      manager.addBindings([binding])

      // No sidebar - should not match
      let result = manager.handleKey({ name: 'tab' }, createKeyboardContext({ hasSidebar: false }))
      expect(result).toBe(false)

      // Has sidebar - should match
      result = manager.handleKey({ name: 'tab' }, createKeyboardContext({ hasSidebar: true }))
      expect(result).toBe(true)
    })

    it('should always match binding without condition', () => {
      const binding = createBinding({ key: 'a' }) // No 'when' condition
      manager.addBindings([binding])

      const context = createKeyboardContext()
      const result = manager.handleKey({ name: 'a' }, context)

      expect(result).toBe(true)
    })

    it('should match multiple conditions (AND logic)', () => {
      const binding = createBinding({
        key: 'enter',
        when: {
          hasPrompt: true,
          focusArea: 'content',
        },
      })
      manager.addBindings([binding])

      // Only hasPrompt true - should not match
      let result = manager.handleKey(
        { name: 'enter' },
        createKeyboardContext({ hasPrompt: true, focusArea: 'sidebar' }),
      )
      expect(result).toBe(false)

      // Both conditions true - should match
      result = manager.handleKey(
        { name: 'enter' },
        createKeyboardContext({ hasPrompt: true, focusArea: 'content' }),
      )
      expect(result).toBe(true)
    })
  })

  describe('getBindingsForHelp', () => {
    it('should return only bindings with descriptions', () => {
      const withDesc = createBinding({ key: 'a', description: 'Has description' })
      const withoutDesc = createBinding({ key: 'b', description: '' })
      const alsoWithDesc = createBinding({ key: 'c', description: 'Also has description' })

      manager.addBindings([withDesc, withoutDesc, alsoWithDesc])

      const helpBindings = manager.getBindingsForHelp()
      expect(helpBindings).toHaveLength(2)
      expect(helpBindings.map((b) => b.key)).toContain('a')
      expect(helpBindings.map((b) => b.key)).toContain('c')
    })
  })

  describe('getBindingsByCategory', () => {
    it('should group bindings by category', () => {
      const general = createBinding({ key: 'a', category: 'general', description: 'General' })
      const nav1 = createBinding({ key: 'j', category: 'navigation', description: 'Down' })
      const nav2 = createBinding({ key: 'k', category: 'navigation', description: 'Up' })
      const screen = createBinding({ key: '1', category: 'screen', description: 'Screen 1' })

      manager.addBindings([general, nav1, nav2, screen])

      const grouped = manager.getBindingsByCategory()

      expect(grouped.general).toHaveLength(1)
      expect(grouped.navigation).toHaveLength(2)
      expect(grouped.screen).toHaveLength(1)
      expect(grouped.prompt).toHaveLength(0)
      expect(grouped.filter).toHaveLength(0)
    })

    it('should exclude bindings without descriptions', () => {
      const withDesc = createBinding({ key: 'a', category: 'general', description: 'Has desc' })
      const withoutDesc = createBinding({ key: 'b', category: 'general', description: '' })

      manager.addBindings([withDesc, withoutDesc])

      const grouped = manager.getBindingsByCategory()

      expect(grouped.general).toHaveLength(1)
    })
  })
})

describe('formatKeyBinding', () => {
  it('should format single key', () => {
    const binding: KeyBinding = {
      key: 'a',
      handler: () => true,
      description: 'Test',
      category: 'general',
    }

    expect(formatKeyBinding(binding)).toBe('a')
  })

  it('should format key with ctrl modifier', () => {
    const binding: KeyBinding = {
      key: 'c',
      ctrl: true,
      handler: () => true,
      description: 'Test',
      category: 'general',
    }

    expect(formatKeyBinding(binding)).toBe('Ctrl+c')
  })

  it('should format key with meta modifier', () => {
    const binding: KeyBinding = {
      key: 's',
      meta: true,
      handler: () => true,
      description: 'Test',
      category: 'general',
    }

    expect(formatKeyBinding(binding)).toBe('Cmd+s')
  })

  it('should format key with shift modifier', () => {
    const binding: KeyBinding = {
      key: 'tab',
      shift: true,
      handler: () => true,
      description: 'Test',
      category: 'general',
    }

    expect(formatKeyBinding(binding)).toBe('Shift+Tab')
  })

  it('should format key with multiple modifiers', () => {
    const binding: KeyBinding = {
      key: 's',
      ctrl: true,
      shift: true,
      handler: () => true,
      description: 'Test',
      category: 'general',
    }

    expect(formatKeyBinding(binding)).toBe('Ctrl+Shift+s')
  })

  it('should format special keys with symbols', () => {
    const testCases: Array<{ key: string; expected: string }> = [
      { key: 'up', expected: '↑' },
      { key: 'down', expected: '↓' },
      { key: 'left', expected: '←' },
      { key: 'right', expected: '→' },
      { key: 'return', expected: 'Enter' },
      { key: 'escape', expected: 'Esc' },
      { key: 'space', expected: 'Space' },
      { key: 'tab', expected: 'Tab' },
    ]

    for (const { key, expected } of testCases) {
      const binding: KeyBinding = {
        key,
        handler: () => true,
        description: 'Test',
        category: 'general',
      }
      expect(formatKeyBinding(binding)).toBe(expected)
    }
  })

  it('should format multiple keys with /', () => {
    const binding: KeyBinding = {
      key: ['up', 'k'],
      handler: () => true,
      description: 'Test',
      category: 'general',
    }

    expect(formatKeyBinding(binding)).toBe('↑/k')
  })

  it('should format multiple special keys', () => {
    const binding: KeyBinding = {
      key: ['return', 'space'],
      handler: () => true,
      description: 'Test',
      category: 'general',
    }

    expect(formatKeyBinding(binding)).toBe('Enter/Space')
  })
})
