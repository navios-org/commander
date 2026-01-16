import * as readline from 'node:readline'

import type {
  ChoicePromptData,
  ConfirmPromptData,
  InputPromptData,
  MultiChoicePromptData,
  PromptData,
} from '../types/index.ts'

/**
 * Readline-based prompt service for stdout mode.
 * Provides basic interactive prompts when TUI adapter is not available.
 */
export class ReadlinePromptService {
  private rl: readline.Interface | null = null
  private promptQueue: Array<{
    prompt: PromptData
    resolve: (value: string | boolean | string[]) => void
  }> = []
  private isProcessing = false

  private ensureInterface(): readline.Interface {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    }
    return this.rl
  }

  /**
   * Handle a prompt interactively via readline.
   * Prompts are queued and processed sequentially.
   */
  async handlePrompt(prompt: PromptData): Promise<string | boolean | string[]> {
    return new Promise((resolve) => {
      this.promptQueue.push({ prompt, resolve })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.promptQueue.length === 0) return

    this.isProcessing = true

    while (this.promptQueue.length > 0) {
      const { prompt, resolve } = this.promptQueue.shift()!
      const result = await this.processPrompt(prompt)
      resolve(result)
    }

    this.isProcessing = false
  }

  private async processPrompt(prompt: PromptData): Promise<string | boolean | string[]> {
    switch (prompt.type) {
      case 'choice':
        return this.handleChoice(prompt)
      case 'confirm':
        return this.handleConfirm(prompt)
      case 'input':
        return this.handleInput(prompt)
      case 'multiChoice':
        return this.handleMultiChoice(prompt)
    }
  }

  private async handleChoice(prompt: ChoicePromptData): Promise<string> {
    const rl = this.ensureInterface()

    // Display question and choices
    console.log(`\n${prompt.question}`)
    prompt.choices.forEach((choice, index) => {
      const isDefault = choice.value === prompt.defaultChoice
      const marker = isDefault ? '*' : ' '
      const inputHint = choice.input ? ' (allows custom input)' : ''
      console.log(`  ${marker} ${index + 1}. ${choice.label}${inputHint}`)
    })

    return new Promise((resolve) => {
      rl.question('Enter number (or press Enter for default): ', (answer) => {
        const trimmed = answer.trim()
        if (!trimmed) {
          resolve(prompt.defaultChoice)
          return
        }

        const num = parseInt(trimmed, 10)
        if (num >= 1 && num <= prompt.choices.length) {
          const choice = prompt.choices[num - 1]
          if (choice.input) {
            // If choice allows input, ask for it
            rl.question(`Enter value for "${choice.label}": `, (inputValue) => {
              resolve(inputValue.trim() || choice.value)
            })
          } else {
            resolve(choice.value)
          }
        } else {
          resolve(prompt.defaultChoice)
        }
      })
    })
  }

  private async handleConfirm(prompt: ConfirmPromptData): Promise<boolean> {
    const rl = this.ensureInterface()
    const defaultText = prompt.defaultValue ? 'Y/n' : 'y/N'

    return new Promise((resolve) => {
      rl.question(`${prompt.question} [${defaultText}]: `, (answer) => {
        const trimmed = answer.trim().toLowerCase()
        if (!trimmed) {
          resolve(prompt.defaultValue)
          return
        }
        resolve(trimmed === 'y' || trimmed === 'yes')
      })
    })
  }

  private async handleInput(prompt: InputPromptData): Promise<string> {
    const rl = this.ensureInterface()
    const defaultHint = prompt.defaultValue ? ` (default: ${prompt.defaultValue})` : ''
    const placeholderHint = prompt.placeholder ? ` [${prompt.placeholder}]` : ''

    return new Promise((resolve) => {
      rl.question(`${prompt.question}${placeholderHint}${defaultHint}: `, (answer) => {
        resolve(answer.trim() || prompt.defaultValue)
      })
    })
  }

  private async handleMultiChoice(prompt: MultiChoicePromptData): Promise<string[]> {
    const rl = this.ensureInterface()

    // Display question and choices
    console.log(`\n${prompt.question}`)
    console.log(
      `(Select ${prompt.minSelect}-${prompt.maxSelect} options, enter comma-separated numbers)`,
    )
    prompt.choices.forEach((choice, index) => {
      const selected = prompt.selectedIndices.has(index) ? '[x]' : '[ ]'
      console.log(`  ${selected} ${index + 1}. ${choice.label}`)
    })

    return new Promise((resolve) => {
      rl.question('Enter numbers (e.g., 1,3,5): ', (answer) => {
        const trimmed = answer.trim()
        if (!trimmed) {
          // Return default selections
          resolve(
            prompt.choices.filter((_, i) => prompt.selectedIndices.has(i)).map((c) => c.value),
          )
          return
        }

        const indices = trimmed
          .split(',')
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((n) => n >= 0 && n < prompt.choices.length)

        // Validate selection count
        if (indices.length < prompt.minSelect) {
          console.log(`Minimum ${prompt.minSelect} selections required. Using defaults.`)
          resolve(
            prompt.choices.filter((_, i) => prompt.selectedIndices.has(i)).map((c) => c.value),
          )
          return
        }

        if (indices.length > prompt.maxSelect) {
          console.log(
            `Maximum ${prompt.maxSelect} selections allowed. Taking first ${prompt.maxSelect}.`,
          )
          indices.splice(prompt.maxSelect)
        }

        resolve(indices.map((i) => prompt.choices[i].value))
      })
    })
  }

  /**
   * Cleanup readline interface
   */
  destroy(): void {
    if (this.rl) {
      this.rl.close()
      this.rl = null
    }
    this.promptQueue = []
    this.isProcessing = false
  }
}
