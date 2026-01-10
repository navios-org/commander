import { describe, expect, it } from 'vitest'

import { PromptRenderer } from '../../components/prompt/prompt_renderer.tsx'
import {
  createChoicePrompt,
  createConfirmPrompt,
  createInputPrompt,
  createMultiChoicePrompt,
  STABLE_TIMESTAMP,
} from '../utils/factories.ts'
import { wrapWithContext } from '../utils/render-utils.tsx'

describe('PromptRenderer', () => {
  describe('choice prompt', () => {
    it('should render choice prompt with options', () => {
      const prompt = createChoicePrompt({
        question: 'Select an option',
        choices: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
          { label: 'Option C', value: 'c' },
        ],
        selectedIndex: 0,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render selected option highlighted', () => {
      const prompt = createChoicePrompt({
        question: 'Choose wisely',
        choices: [
          { label: 'First', value: '1' },
          { label: 'Second', value: '2' },
          { label: 'Third', value: '3' },
        ],
        selectedIndex: 1,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render choice with input mode', () => {
      const prompt = createChoicePrompt({
        question: 'Select or type',
        choices: [
          { label: 'Option A', value: 'a' },
          { label: 'Other', value: 'other', input: true },
        ],
        selectedIndex: 1,
        inputMode: true,
        inputValue: 'custom value',
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render choice with timeout', () => {
      const prompt = createChoicePrompt({
        question: 'Quick! Select one',
        choices: [{ label: 'Default', value: 'default' }],
        timeout: 10000,
        timeoutStarted: STABLE_TIMESTAMP.getTime() - 5000, // 5 seconds elapsed from stable timestamp
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render resolved choice prompt', () => {
      const prompt = createChoicePrompt({
        question: 'Already answered',
        choices: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        selectedIndex: 0,
        resolved: true,
        resolvedValue: 'yes',
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('confirm prompt', () => {
    it('should render confirm prompt (Yes/No)', () => {
      const prompt = createConfirmPrompt({
        question: 'Are you sure?',
        confirmText: 'Yes',
        cancelText: 'No',
        selectedValue: true,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render with No selected', () => {
      const prompt = createConfirmPrompt({
        question: 'Continue?',
        confirmText: 'Yes',
        cancelText: 'No',
        selectedValue: false,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render with custom button labels', () => {
      const prompt = createConfirmPrompt({
        question: 'Delete this file?',
        confirmText: 'Delete',
        cancelText: 'Keep',
        selectedValue: true,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render resolved confirm prompt', () => {
      const prompt = createConfirmPrompt({
        question: 'Already confirmed',
        resolved: true,
        resolvedValue: true,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('input prompt', () => {
    it('should render input prompt with placeholder', () => {
      const prompt = createInputPrompt({
        question: 'Enter your name',
        placeholder: 'John Doe',
        value: '',
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render input with entered value', () => {
      const prompt = createInputPrompt({
        question: 'Enter your email',
        placeholder: 'user@example.com',
        value: 'test@test.com',
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render resolved input prompt', () => {
      const prompt = createInputPrompt({
        question: 'Already answered',
        value: 'My answer',
        resolved: true,
        resolvedValue: 'My answer',
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('multiChoice prompt', () => {
    it('should render multiChoice with checkboxes', () => {
      const prompt = createMultiChoicePrompt({
        question: 'Select all that apply',
        choices: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
          { label: 'Option C', value: 'c' },
        ],
        selectedIndices: new Set(),
        focusedIndex: 0,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render with some options selected', () => {
      const prompt = createMultiChoicePrompt({
        question: 'Choose features',
        choices: [
          { label: 'Feature A', value: 'a' },
          { label: 'Feature B', value: 'b' },
          { label: 'Feature C', value: 'c' },
        ],
        selectedIndices: new Set([0, 2]),
        focusedIndex: 1,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should show selection count', () => {
      const prompt = createMultiChoicePrompt({
        question: 'Select up to 3',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
          { label: 'D', value: 'd' },
        ],
        selectedIndices: new Set([0, 2]),
        maxSelect: 3,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should show minSelect warning when not met', () => {
      const prompt = createMultiChoicePrompt({
        question: 'Select at least 2',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
        ],
        selectedIndices: new Set([0]), // Only 1 selected
        minSelect: 2,
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })

    it('should render resolved multiChoice prompt', () => {
      const prompt = createMultiChoicePrompt({
        question: 'Already selected',
        choices: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        selectedIndices: new Set([0, 1]),
        resolved: true,
        resolvedValues: ['a', 'b'],
      })

      const component = wrapWithContext(<PromptRenderer prompt={prompt} />)

      expect(component).toMatchSnapshot()
    })
  })
})
