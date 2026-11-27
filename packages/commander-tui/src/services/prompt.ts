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
let promptCount = 0
function promptId(): string {
  return `prompt-${++promptCount}`
}

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
    if (defaultIndex === -1) {
      throw new Error(`The default choice "${defaultChoice}" is not among the choices`)
    }

    const prompt: ChoicePromptData = {
      type: 'choice',
      id: promptId(),
      timestamp: new Date(),
      question,
      choices,
      defaultChoice: defaultChoice ?? choices[0]?.value ?? '',
      selectedIndex: Math.max(0, defaultIndex),
      inputMode: false,
      inputValue: '',
      resolved: false,
      timeout,
      timeoutStarted: undefined,
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
      // Where nobody can answer, the default is the answer: it must not be a yes.
      defaultValue = false,
      timeout,
    } = options

    const prompt: ConfirmPromptData = {
      type: 'confirm',
      id: promptId(),
      timestamp: new Date(),
      question,
      confirmText,
      cancelText,
      defaultValue,
      selectedValue: defaultValue,
      resolved: false,
      timeout,
      timeoutStarted: undefined,
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
      id: promptId(),
      timestamp: new Date(),
      question,
      placeholder,
      defaultValue,
      value: defaultValue,
      resolved: false,
      timeout,
      timeoutStarted: undefined,
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
      id: promptId(),
      timestamp: new Date(),
      question,
      choices,
      selectedIndices,
      focusedIndex: 0,
      minSelect,
      maxSelect,
      resolved: false,
      timeout,
      timeoutStarted: undefined,
    }

    return this.screen._addPrompt(prompt) as Promise<string[]>
  }
}
