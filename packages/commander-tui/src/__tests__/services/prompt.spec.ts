import { TestContainer } from '@navios/core/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { PromptInstance } from '../../services/prompt.ts'
import { Screen } from '../../tokens/index.ts'
import { createMockScreenInstance } from '../utils/factories.ts'

import type { MockScreenInstance } from '../utils/factories.ts'

describe('PromptInstance', () => {
  let container: TestContainer
  let mockScreen: MockScreenInstance

  beforeEach(() => {
    container = new TestContainer()
    mockScreen = createMockScreenInstance()
    container.bind(Screen).toValue(mockScreen)
  })

  afterEach(async () => {
    await container.dispose()
  })

  async function createPrompt() {
    return container.get(PromptInstance, { screen: 'test' })
  }

  describe('choice', () => {
    it('should create ChoicePromptData with correct structure', async () => {
      const prompt = await createPrompt()

      prompt.choice({
        question: 'Select an option',
        choices: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ],
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'choice',
          question: 'Select an option',
          choices: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
          ],
          inputMode: false,
          inputValue: '',
          resolved: false,
        }),
      )
    })

    it('should set defaultChoice and selectedIndex', async () => {
      const prompt = await createPrompt()

      prompt.choice({
        question: 'Select',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
        ],
        defaultChoice: 'b',
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultChoice: 'b',
          selectedIndex: 1,
        }),
      )
    })

    it('should default selectedIndex to 0 if defaultChoice not found', async () => {
      const prompt = await createPrompt()

      prompt.choice({
        question: 'Select',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        defaultChoice: 'nonexistent',
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedIndex: 0,
        }),
      )
    })

    it('should include timeout when provided', async () => {
      const prompt = await createPrompt()

      prompt.choice({
        question: 'Select',
        choices: [{ label: 'A', value: 'a' }],
        timeout: 5000,
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
          timeoutStarted: expect.any(Number),
        }),
      )
    })

    it('should return Promise from screen._addPrompt', async () => {
      mockScreen._addPrompt.mockResolvedValue('selected')
      const prompt = await createPrompt()

      const result = await prompt.choice({
        question: 'Select',
        choices: [{ label: 'A', value: 'a' }],
      })

      expect(result).toBe('selected')
    })
  })

  describe('confirm', () => {
    it('should create ConfirmPromptData with defaults', async () => {
      const prompt = await createPrompt()

      prompt.confirm({
        question: 'Are you sure?',
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'confirm',
          question: 'Are you sure?',
          confirmText: 'Yes',
          cancelText: 'No',
          defaultValue: true,
          selectedValue: true,
          resolved: false,
        }),
      )
    })

    it('should use custom confirmText and cancelText', async () => {
      const prompt = await createPrompt()

      prompt.confirm({
        question: 'Delete file?',
        confirmText: 'Delete',
        cancelText: 'Keep',
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmText: 'Delete',
          cancelText: 'Keep',
        }),
      )
    })

    it('should respect defaultValue', async () => {
      const prompt = await createPrompt()

      prompt.confirm({
        question: 'Confirm?',
        defaultValue: false,
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultValue: false,
          selectedValue: false,
        }),
      )
    })

    it('should include timeout when provided', async () => {
      const prompt = await createPrompt()

      prompt.confirm({
        question: 'Confirm?',
        timeout: 10000,
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
          timeoutStarted: expect.any(Number),
        }),
      )
    })

    it('should return Promise<boolean>', async () => {
      mockScreen._addPrompt.mockResolvedValue(false)
      const prompt = await createPrompt()

      const result = await prompt.confirm({
        question: 'Confirm?',
      })

      expect(result).toBe(false)
    })
  })

  describe('input', () => {
    it('should create InputPromptData with placeholder and defaultValue', async () => {
      const prompt = await createPrompt()

      prompt.input({
        question: 'Enter your name',
        placeholder: 'John Doe',
        defaultValue: 'Anonymous',
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'input',
          question: 'Enter your name',
          placeholder: 'John Doe',
          defaultValue: 'Anonymous',
          value: 'Anonymous',
          resolved: false,
        }),
      )
    })

    it('should use empty string defaults', async () => {
      const prompt = await createPrompt()

      prompt.input({
        question: 'Enter value',
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          placeholder: '',
          defaultValue: '',
          value: '',
        }),
      )
    })

    it('should include timeout when provided', async () => {
      const prompt = await createPrompt()

      prompt.input({
        question: 'Enter',
        timeout: 30000,
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
          timeoutStarted: expect.any(Number),
        }),
      )
    })

    it('should return Promise<string>', async () => {
      mockScreen._addPrompt.mockResolvedValue('entered text')
      const prompt = await createPrompt()

      const result = await prompt.input({
        question: 'Enter',
      })

      expect(result).toBe('entered text')
    })
  })

  describe('multiChoice', () => {
    it('should create MultiChoicePromptData', async () => {
      const prompt = await createPrompt()

      prompt.multiChoice({
        question: 'Select options',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
        ],
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'multiChoice',
          question: 'Select options',
          choices: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
            { label: 'C', value: 'c' },
          ],
          focusedIndex: 0,
          resolved: false,
        }),
      )
    })

    it('should set defaultChoices as selectedIndices', async () => {
      const prompt = await createPrompt()

      prompt.multiChoice({
        question: 'Select',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
        ],
        defaultChoices: ['a', 'c'],
      })

      const call = mockScreen._addPrompt.mock.calls[0][0]
      expect(call.selectedIndices.has(0)).toBe(true)
      expect(call.selectedIndices.has(1)).toBe(false)
      expect(call.selectedIndices.has(2)).toBe(true)
    })

    it('should respect minSelect and maxSelect', async () => {
      const prompt = await createPrompt()

      prompt.multiChoice({
        question: 'Select 2-3 options',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
          { label: 'D', value: 'd' },
        ],
        minSelect: 2,
        maxSelect: 3,
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          minSelect: 2,
          maxSelect: 3,
        }),
      )
    })

    it('should default minSelect to 0 and maxSelect to choices length', async () => {
      const prompt = await createPrompt()

      prompt.multiChoice({
        question: 'Select',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          minSelect: 0,
          maxSelect: 2,
        }),
      )
    })

    it('should include timeout when provided', async () => {
      const prompt = await createPrompt()

      prompt.multiChoice({
        question: 'Select',
        choices: [{ label: 'A', value: 'a' }],
        timeout: 15000,
      })

      expect(mockScreen._addPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 15000,
          timeoutStarted: expect.any(Number),
        }),
      )
    })

    it('should return Promise<string[]>', async () => {
      mockScreen._addPrompt.mockResolvedValue(['a', 'c'])
      const prompt = await createPrompt()

      const result = await prompt.multiChoice({
        question: 'Select',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
        ],
      })

      expect(result).toEqual(['a', 'c'])
    })

    it('should ignore invalid defaultChoices', async () => {
      const prompt = await createPrompt()

      prompt.multiChoice({
        question: 'Select',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        defaultChoices: ['a', 'nonexistent', 'b'],
      })

      const call = mockScreen._addPrompt.mock.calls[0][0]
      expect(call.selectedIndices.size).toBe(2) // Only 'a' and 'b'
    })
  })
})
