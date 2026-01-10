import { inject, Injectable } from '@navios/core'

import { Prompt, Screen } from '../tokens/index.ts'

import type { PromptOptions } from '../schemas/index.ts'
import type {
  ChoiceOptions,
  ChoicePromptData,
  ConfirmOptions,
  ConfirmPromptData,
  InputOptions,
  InputPromptData,
  MultiChoiceOptions,
  MultiChoicePromptData,
} from '../types/index.ts'

import type { ScreenInstance } from './screen.ts'

/**
 * Prompt class for interactive user input.
 * Similar to Logger, but for prompts that require user interaction.
 */
@Injectable({
  token: Prompt,
})
export class PromptInstance {
  private screen: ScreenInstance

  constructor(options: PromptOptions) {
    this.screen = inject(
      Screen,
      typeof options.screen === 'string'
        ? {
            name: options.screen,
          }
        : options.screen,
    )
  }

  /**
   * Display a choice prompt and wait for user selection.
   * Returns the selected value (or input text if an input option was selected).
   */
  async choice(options: ChoiceOptions): Promise<string> {
    const { question, choices, defaultChoice, timeout } = options

    if (choices.length === 0) {
      throw new Error('Choices array cannot be empty')
    }

    // Find default index
    const defaultIndex = defaultChoice ? choices.findIndex((c) => c.value === defaultChoice) : 0

    const prompt: ChoicePromptData = {
      type: 'choice',
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      question,
      choices,
      defaultChoice: defaultChoice ?? choices[0]?.value ?? '',
      selectedIndex: Math.max(0, defaultIndex),
      inputMode: false,
      inputValue: '',
      resolved: false,
      timeout,
      timeoutStarted: timeout ? Date.now() : undefined,
    }

    return this.screen._addPrompt(prompt) as Promise<string>
  }

  /**
   * Display a confirmation prompt and wait for user response.
   * Returns true for confirm, false for cancel.
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const {
      question,
      confirmText = 'Yes',
      cancelText = 'No',
      defaultValue = true,
      timeout,
    } = options

    const prompt: ConfirmPromptData = {
      type: 'confirm',
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      question,
      confirmText,
      cancelText,
      defaultValue,
      selectedValue: defaultValue,
      resolved: false,
      timeout,
      timeoutStarted: timeout ? Date.now() : undefined,
    }

    return this.screen._addPrompt(prompt) as Promise<boolean>
  }

  /**
   * Display a text input prompt and wait for user input.
   * Returns the entered text.
   */
  async input(options: InputOptions): Promise<string> {
    const { question, placeholder = '', defaultValue = '', timeout } = options

    const prompt: InputPromptData = {
      type: 'input',
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      question,
      placeholder,
      defaultValue,
      value: defaultValue,
      resolved: false,
      timeout,
      timeoutStarted: timeout ? Date.now() : undefined,
    }

    return this.screen._addPrompt(prompt) as Promise<string>
  }

  /**
   * Display a multi-select choice prompt.
   * Returns an array of selected values.
   */
  async multiChoice(options: MultiChoiceOptions): Promise<string[]> {
    const {
      question,
      choices,
      defaultChoices = [],
      minSelect = 0,
      maxSelect = choices.length,
      timeout,
    } = options

    if (choices.length === 0) {
      throw new Error('Choices array cannot be empty')
    }

    // Find default indices
    const selectedIndices = new Set<number>()
    defaultChoices.forEach((value) => {
      const index = choices.findIndex((c) => c.value === value)
      if (index !== -1) {
        selectedIndices.add(index)
      }
    })

    const prompt: MultiChoicePromptData = {
      type: 'multiChoice',
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      question,
      choices,
      selectedIndices,
      focusedIndex: 0,
      minSelect,
      maxSelect,
      resolved: false,
      timeout,
      timeoutStarted: timeout ? Date.now() : undefined,
    }

    return this.screen._addPrompt(prompt) as Promise<string[]>
  }
}
