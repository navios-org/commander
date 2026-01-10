import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScreenInstance } from '../../services/screen.ts'
import {
  createChoicePrompt,
  createConfirmPrompt,
  createInputPrompt,
  createLogMessage,
  createMultiChoicePrompt,
} from '../utils/factories.ts'

import type { ScreenManager } from '../../services/screen_manager.tsx'

describe('ScreenInstance', () => {
  let screen: ScreenInstance

  beforeEach(() => {
    screen = new ScreenInstance('test-id', { name: 'Test Screen' })
  })

  describe('construction and getters', () => {
    it('should set id from constructor', () => {
      expect(screen.getId()).toBe('test-id')
    })

    it('should set name from options', () => {
      expect(screen.getName()).toBe('Test Screen')
    })

    it('should set icon from options', () => {
      const screenWithIcon = new ScreenInstance('id', { name: 'Test', icon: '📦' })
      expect(screenWithIcon.getIcon()).toBe('📦')
    })

    it('should return undefined icon when not set', () => {
      expect(screen.getIcon()).toBeUndefined()
    })

    it('should set badgeCount from options', () => {
      const screenWithBadge = new ScreenInstance('id', { name: 'Test', badgeCount: 5 })
      expect(screenWithBadge.getBadgeCount()).toBe(5)
    })

    it('should default badgeCount to 0', () => {
      expect(screen.getBadgeCount()).toBe(0)
    })

    it('should default hidden to false', () => {
      expect(screen.isHidden()).toBe(false)
    })

    it('should set hidden from options', () => {
      const hiddenScreen = new ScreenInstance('id', { name: 'Test', hidden: true })
      expect(hiddenScreen.isHidden()).toBe(true)
    })

    it('should default status to waiting', () => {
      expect(screen.getStatus()).toBe('waiting')
    })
  })

  describe('setBadgeCount', () => {
    it('should update badge count', () => {
      screen.setBadgeCount(10)
      expect(screen.getBadgeCount()).toBe(10)
    })

    it('should be chainable', () => {
      const result = screen.setBadgeCount(5)
      expect(result).toBe(screen)
    })

    it('should notify change listeners', () => {
      const listener = vi.fn()
      screen.onChange(listener)

      screen.setBadgeCount(3)

      expect(listener).toHaveBeenCalled()
    })
  })

  describe('setHidden / show / hide', () => {
    it('should toggle hidden state with setHidden', () => {
      screen.setHidden(true)
      expect(screen.isHidden()).toBe(true)

      screen.setHidden(false)
      expect(screen.isHidden()).toBe(false)
    })

    it('should show screen', () => {
      screen.setHidden(true)
      screen.show()
      expect(screen.isHidden()).toBe(false)
    })

    it('should hide screen', () => {
      screen.hide()
      expect(screen.isHidden()).toBe(true)
    })

    it('should be chainable', () => {
      expect(screen.setHidden(true)).toBe(screen)
      expect(screen.show()).toBe(screen)
      expect(screen.hide()).toBe(screen)
    })

    it('should notify change listeners', () => {
      const listener = vi.fn()
      screen.onChange(listener)

      screen.setHidden(true)

      expect(listener).toHaveBeenCalled()
    })
  })

  describe('setStatus', () => {
    it('should update status', () => {
      screen.setStatus('pending')
      expect(screen.getStatus()).toBe('pending')

      screen.setStatus('success')
      expect(screen.getStatus()).toBe('success')
    })

    it('should be chainable', () => {
      const result = screen.setStatus('fail')
      expect(result).toBe(screen)
    })

    it('should notify change listeners', () => {
      const listener = vi.fn()
      screen.onChange(listener)

      screen.setStatus('success')

      expect(listener).toHaveBeenCalled()
    })

    it('should call manager.onScreenCompleted when transitioning to success', () => {
      const mockManager = {
        onScreenCompleted: vi.fn(),
        onScreenVisibilityChanged: vi.fn(),
        onScreenPromptActivated: vi.fn(),
        isTuiBound: vi.fn(() => true),
      } as unknown as ScreenManager

      screen._setManager(mockManager)
      screen.setStatus('success')

      expect(mockManager.onScreenCompleted).toHaveBeenCalledWith(screen)
    })

    it('should call manager.onScreenCompleted when transitioning to fail', () => {
      const mockManager = {
        onScreenCompleted: vi.fn(),
        onScreenVisibilityChanged: vi.fn(),
        onScreenPromptActivated: vi.fn(),
        isTuiBound: vi.fn(() => true),
      } as unknown as ScreenManager

      screen._setManager(mockManager)
      screen.setStatus('fail')

      expect(mockManager.onScreenCompleted).toHaveBeenCalledWith(screen)
    })

    it('should not call onScreenCompleted when already complete', () => {
      const mockManager = {
        onScreenCompleted: vi.fn(),
        onScreenVisibilityChanged: vi.fn(),
        onScreenPromptActivated: vi.fn(),
        isTuiBound: vi.fn(() => true),
      } as unknown as ScreenManager

      screen._setManager(mockManager)
      screen.setStatus('success')
      screen.setStatus('fail') // Already complete

      expect(mockManager.onScreenCompleted).toHaveBeenCalledTimes(1)
    })
  })

  describe('isComplete', () => {
    it('should return false for waiting status', () => {
      expect(screen.isComplete()).toBe(false)
    })

    it('should return false for pending status', () => {
      screen.setStatus('pending')
      expect(screen.isComplete()).toBe(false)
    })

    it('should return true for success status', () => {
      screen.setStatus('success')
      expect(screen.isComplete()).toBe(true)
    })

    it('should return true for fail status', () => {
      screen.setStatus('fail')
      expect(screen.isComplete()).toBe(true)
    })
  })

  describe('message management', () => {
    it('should add message to array', () => {
      const message = createLogMessage()
      screen.addMessage(message)

      expect(screen.getMessages()).toHaveLength(1)
      expect(screen.getMessages()[0]).toEqual(message)
    })

    it('should return copy of messages array', () => {
      const message = createLogMessage()
      screen.addMessage(message)

      const messages1 = screen.getMessages()
      const messages2 = screen.getMessages()

      expect(messages1).not.toBe(messages2)
      expect(messages1).toEqual(messages2)
    })

    it('should notify change listeners when adding message', () => {
      const listener = vi.fn()
      screen.onChange(listener)

      screen.addMessage(createLogMessage())

      expect(listener).toHaveBeenCalled()
    })

    it('should update message by id', () => {
      const message = createLogMessage({ id: 'msg-1', content: 'Original' })
      screen.addMessage(message)

      screen.updateMessage('msg-1', { content: 'Updated' } as any)

      const messages = screen.getMessages()
      expect((messages[0] as any).content).toBe('Updated')
    })

    it('should not update if id not found', () => {
      const message = createLogMessage({ id: 'msg-1', content: 'Original' })
      screen.addMessage(message)

      screen.updateMessage('nonexistent', { content: 'Updated' } as any)

      const messages = screen.getMessages()
      expect((messages[0] as any).content).toBe('Original')
    })

    it('should update progress message by id', () => {
      const message = {
        id: 'progress-1',
        type: 'progress' as const,
        timestamp: new Date(),
        label: 'Processing',
        current: 0,
        total: 100,
        status: 'active' as const,
      }
      screen.addMessage(message)

      screen.updateProgressMessage('progress-1', { current: 50 })

      const messages = screen.getMessages()
      expect((messages[0] as any).current).toBe(50)
    })

    it('should clear all messages', () => {
      screen.addMessage(createLogMessage())
      screen.addMessage(createLogMessage())
      screen.addMessage(createLogMessage())

      expect(screen.getMessages()).toHaveLength(3)

      screen.clear()

      expect(screen.getMessages()).toHaveLength(0)
    })

    it('should be chainable (clear)', () => {
      const result = screen.clear()
      expect(result).toBe(screen)
    })
  })

  describe('prompt queue system', () => {
    let mockManager: ScreenManager

    beforeEach(() => {
      mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
    })

    it('should return Promise from _addPrompt', () => {
      screen._setManager(mockManager)
      const prompt = createChoicePrompt()
      const result = screen._addPrompt(prompt)

      expect(result).toBeInstanceOf(Promise)
    })

    it('should return active prompt after adding', () => {
      screen._setManager(mockManager)
      const prompt = createChoicePrompt()
      screen._addPrompt(prompt)

      expect(screen.getActivePrompt()).toEqual(prompt)
    })

    it('should return true for hasActivePrompt when prompt exists', () => {
      screen._setManager(mockManager)
      const prompt = createChoicePrompt()
      screen._addPrompt(prompt)

      expect(screen.hasActivePrompt()).toBe(true)
    })

    it('should return false for hasActivePrompt when no prompt', () => {
      expect(screen.hasActivePrompt()).toBe(false)
    })

    it('should queue multiple prompts', () => {
      screen._setManager(mockManager)
      const prompt1 = createChoicePrompt({ question: 'First?' })
      const prompt2 = createChoicePrompt({ question: 'Second?' })

      screen._addPrompt(prompt1)
      screen._addPrompt(prompt2)

      // First prompt should be active
      expect(screen.getActivePrompt()?.question).toBe('First?')
    })

    it('should resolve with default immediately in non-interactive mode', async () => {
      // No manager bound = non-interactive mode
      const prompt = createChoicePrompt({ defaultChoice: 'default-value' })

      const result = await screen._addPrompt(prompt)

      expect(result).toBe('default-value')
    })
  })

  describe('prompt navigation', () => {
    describe('choice prompts', () => {
      beforeEach(() => {
        const prompt = createChoicePrompt({
          choices: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
            { label: 'C', value: 'c' },
          ],
          selectedIndex: 0,
        })
        // Need to mock manager to prevent immediate resolution
        const mockManager = {
          isTuiBound: vi.fn(() => true),
          onScreenPromptActivated: vi.fn(),
        } as unknown as ScreenManager
        screen._setManager(mockManager)
        screen._addPrompt(prompt)
      })

      it('should update selection with updatePromptSelection', () => {
        screen.updatePromptSelection(2)
        expect(screen.getActivePrompt()?.selectedIndex).toBe(2)
      })

      it('should clamp selection to valid range (min)', () => {
        screen.updatePromptSelection(-5)
        expect(screen.getActivePrompt()?.selectedIndex).toBe(0)
      })

      it('should clamp selection to valid range (max)', () => {
        screen.updatePromptSelection(100)
        expect(screen.getActivePrompt()?.selectedIndex).toBe(2)
      })

      it('should navigate up', () => {
        screen.updatePromptSelection(2)
        screen.promptNavigateUp()
        expect(screen.getActivePrompt()?.selectedIndex).toBe(1)
      })

      it('should navigate down', () => {
        screen.promptNavigateDown()
        expect(screen.getActivePrompt()?.selectedIndex).toBe(1)
      })
    })

    describe('confirm prompts', () => {
      beforeEach(() => {
        const prompt = createConfirmPrompt({ selectedValue: true })
        const mockManager = {
          isTuiBound: vi.fn(() => true),
          onScreenPromptActivated: vi.fn(),
        } as unknown as ScreenManager
        screen._setManager(mockManager)
        screen._addPrompt(prompt)
      })

      it('should navigate left (select true)', () => {
        const prompt = screen.getActivePrompt() as any
        prompt.selectedValue = false

        screen.promptNavigateLeft()

        expect(screen.getActivePrompt()?.selectedValue).toBe(true)
      })

      it('should navigate right (select false)', () => {
        screen.promptNavigateRight()
        expect(screen.getActivePrompt()?.selectedValue).toBe(false)
      })
    })

    describe('multiChoice prompts', () => {
      beforeEach(() => {
        const prompt = createMultiChoicePrompt({
          choices: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
            { label: 'C', value: 'c' },
          ],
          selectedIndices: new Set(),
          focusedIndex: 0,
          maxSelect: 3,
        })
        const mockManager = {
          isTuiBound: vi.fn(() => true),
          onScreenPromptActivated: vi.fn(),
        } as unknown as ScreenManager
        screen._setManager(mockManager)
        screen._addPrompt(prompt)
      })

      it('should toggle selection', () => {
        screen.promptToggleSelection()
        expect((screen.getActivePrompt() as any).selectedIndices.has(0)).toBe(true)

        screen.promptToggleSelection()
        expect((screen.getActivePrompt() as any).selectedIndices.has(0)).toBe(false)
      })

      it('should respect maxSelect limit', () => {
        const prompt = screen.getActivePrompt() as any
        prompt.maxSelect = 1
        prompt.selectedIndices.add(0)

        screen.updatePromptSelection(1)
        screen.promptToggleSelection() // Should not add because maxSelect is 1

        expect(prompt.selectedIndices.size).toBe(1)
      })
    })
  })

  describe('prompt input mode', () => {
    it('should enter input mode for choice with input option', () => {
      const prompt = createChoicePrompt({
        choices: [{ label: 'Other', value: 'other', input: true }],
        selectedIndex: 0,
      })
      const mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
      screen._addPrompt(prompt)

      const result = screen.promptEnterInputMode()

      expect(result).toBe(true)
      expect(screen.isPromptInInputMode()).toBe(true)
    })

    it('should not enter input mode for choice without input option', () => {
      const prompt = createChoicePrompt({
        choices: [{ label: 'Regular', value: 'regular' }],
        selectedIndex: 0,
      })
      const mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
      screen._addPrompt(prompt)

      const result = screen.promptEnterInputMode()

      expect(result).toBe(false)
    })

    it('should always be in input mode for input prompts', () => {
      const prompt = createInputPrompt()
      const mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
      screen._addPrompt(prompt)

      expect(screen.isPromptInInputMode()).toBe(true)
    })

    it('should exit input mode for choice prompts', () => {
      const prompt = createChoicePrompt({
        choices: [{ label: 'Other', value: 'other', input: true }],
        selectedIndex: 0,
        inputMode: true,
      })
      const mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
      screen._addPrompt(prompt)

      screen.promptExitInputMode()

      expect((screen.getActivePrompt() as any).inputMode).toBe(false)
    })

    it('should update input value', () => {
      const prompt = createInputPrompt({ value: '' })
      const mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
      screen._addPrompt(prompt)

      screen.promptUpdateInput('hello')

      expect((screen.getActivePrompt() as any).value).toBe('hello')
    })

    it('should append to input value', () => {
      const prompt = createInputPrompt({ value: 'hel' })
      const mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
      screen._addPrompt(prompt)

      screen.promptAppendInput('lo')

      expect((screen.getActivePrompt() as any).value).toBe('hello')
    })

    it('should delete last character from input', () => {
      const prompt = createInputPrompt({ value: 'hello' })
      const mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
      screen._addPrompt(prompt)

      screen.promptDeleteLastChar()

      expect((screen.getActivePrompt() as any).value).toBe('hell')
    })
  })

  describe('promptSubmit', () => {
    let mockManager: ScreenManager

    beforeEach(() => {
      mockManager = {
        isTuiBound: vi.fn(() => true),
        onScreenPromptActivated: vi.fn(),
      } as unknown as ScreenManager
      screen._setManager(mockManager)
    })

    it('should resolve choice prompt with selected value', async () => {
      const prompt = createChoicePrompt({
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        selectedIndex: 1,
      })

      const resultPromise = screen._addPrompt(prompt)
      screen.promptSubmit()

      const result = await resultPromise
      expect(result).toBe('b')
    })

    it('should resolve choice prompt with input value when in input mode', async () => {
      const prompt = createChoicePrompt({
        choices: [{ label: 'Other', value: 'other', input: true }],
        selectedIndex: 0,
        inputMode: true,
        inputValue: 'custom input',
      })

      const resultPromise = screen._addPrompt(prompt)
      screen.promptSubmit()

      const result = await resultPromise
      expect(result).toBe('custom input')
    })

    it('should resolve confirm prompt with boolean', async () => {
      const prompt = createConfirmPrompt({ selectedValue: false })

      const resultPromise = screen._addPrompt(prompt)
      screen.promptSubmit()

      const result = await resultPromise
      expect(result).toBe(false)
    })

    it('should resolve input prompt with text value', async () => {
      const prompt = createInputPrompt({ value: 'entered text' })

      const resultPromise = screen._addPrompt(prompt)
      screen.promptSubmit()

      const result = await resultPromise
      expect(result).toBe('entered text')
    })

    it('should resolve multiChoice with selected values array', async () => {
      const prompt = createMultiChoicePrompt({
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
        ],
        selectedIndices: new Set([0, 2]),
      })

      const resultPromise = screen._addPrompt(prompt)
      screen.promptSubmit()

      const result = await resultPromise
      expect(result).toEqual(['a', 'c'])
    })

    it('should respect minSelect constraint (canSubmitPrompt)', () => {
      const prompt = createMultiChoicePrompt({
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        selectedIndices: new Set(),
        minSelect: 1,
      })

      screen._addPrompt(prompt)

      expect(screen.canSubmitPrompt()).toBe(false)

      screen.promptToggleSelection() // Select first item

      expect(screen.canSubmitPrompt()).toBe(true)
    })

    it('should activate next prompt after submit', async () => {
      const prompt1 = createChoicePrompt({ question: 'First?' })
      const prompt2 = createChoicePrompt({ question: 'Second?' })

      screen._addPrompt(prompt1)
      screen._addPrompt(prompt2)

      expect(screen.getActivePrompt()?.question).toBe('First?')

      screen.promptSubmit()

      expect(screen.getActivePrompt()?.question).toBe('Second?')
    })
  })

  describe('change listeners', () => {
    it('should register listener with onChange', () => {
      const listener = vi.fn()
      screen.onChange(listener)

      screen.addMessage(createLogMessage())

      expect(listener).toHaveBeenCalled()
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = screen.onChange(listener)

      unsubscribe()
      screen.addMessage(createLogMessage())

      expect(listener).not.toHaveBeenCalled()
    })

    it('should notify all listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      screen.onChange(listener1)
      screen.onChange(listener2)

      screen.addMessage(createLogMessage())

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })
})
