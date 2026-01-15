import { EventEmitter } from 'node:events'

import type { LogLevel } from '@navios/core'

import { getPromptDefaultValue, printSingleMessage } from '../utils/index.ts'

import type { ScreenOptions } from '../schemas/index.ts'
import { RenderMode } from '../types/index.ts'
import type {
  ChoicePromptData,
  ConfirmPromptData,
  InputPromptData,
  LoadingMessageData,
  MessageData,
  MultiChoicePromptData,
  ProgressMessageData,
  PromptData,
  ScreenEventMap,
  ScreenStatus,
} from '../types/index.ts'

import type { ScreenManagerInstance } from './screen_manager.ts'

interface PendingPrompt {
  data: PromptData
  resolve: (value: string | boolean | string[]) => void
  timeoutId?: ReturnType<typeof setTimeout>
}

export class ScreenInstance extends EventEmitter<ScreenEventMap> {
  private id: string
  private name: string
  private icon?: string
  private badgeCount: number = 0
  private status: ScreenStatus = 'waiting'
  private hidden: boolean = false
  private messages: MessageData[] = []
  private manager: ScreenManagerInstance | null = null
  private printFn: ((messages: MessageData[], name: string, isError: boolean) => void) | null = null
  private hasPrinted: boolean = false
  private version: number = 0

  // Prompt queue system
  private promptQueue: PendingPrompt[] = []
  private activePrompt: PendingPrompt | null = null

  constructor(id: string, options: ScreenOptions) {
    super()
    this.id = id
    this.name = options.name
    this.icon = options.icon
    this.badgeCount = options.badgeCount ?? 0
    this.hidden = options.hidden ?? false
    if (options.static) {
      this.status = 'static'
    }
  }

  incrementVersion(): void {
    this.version++
  }

  getVersion(): number {
    return this.version
  }

  /**
   * Internal: Set the manager reference
   */
  _setManager(manager: ScreenManagerInstance): void {
    this.manager = manager
  }

  /**
   * Internal: Set the print function for stdout output
   */
  _setPrintFn(fn: (messages: MessageData[], name: string, isError: boolean) => void): void {
    this.printFn = fn
  }

  getId(): string {
    return this.id
  }

  getName(): string {
    return this.name
  }

  getIcon(): string | undefined {
    return this.icon
  }

  getBadgeCount(): number {
    return this.badgeCount
  }

  setBadgeCount(count: number): this {
    this.badgeCount = count
    this.emit('badge:changed', count)
    return this
  }

  isHidden(): boolean {
    return this.hidden
  }

  setHidden(hidden: boolean): this {
    this.hidden = hidden
    this.manager?.onScreenVisibilityChanged(this)
    this.emit('visibility:changed', hidden)
    return this
  }

  show(): this {
    return this.setHidden(false)
  }

  hide(): this {
    return this.setHidden(true)
  }

  getStatus(): ScreenStatus {
    return this.status
  }

  /**
   * Check if a log level is enabled globally via the ScreenManager.
   * Returns true if no manager is set or if the level is allowed.
   */
  isLogLevelEnabled(level: LogLevel): boolean {
    if (!this.manager) {
      return true
    }
    return this.manager.isLogLevelEnabled(level)
  }

  /**
   * Set screen status. When success/fail and not in TUI mode, prints to stdout/stderr
   */
  setStatus(status: ScreenStatus): this {
    const wasComplete = this.status === 'success' || this.status === 'fail'
    this.status = status

    // When transitioning to complete state
    if (!wasComplete && (status === 'success' || status === 'fail')) {
      // Only print immediately if NOT in TUI mode
      // In TUI mode, printing happens on unbind()
      if (!this.manager?.hasTuiRenderer()) {
        this.printToConsole()
      }
      this.manager?.onScreenCompleted(this)
    }

    this.emit('status:changed', status)
    return this
  }

  /**
   * Check if this screen is complete (success or fail)
   */
  isComplete(): boolean {
    return this.status === 'success' || this.status === 'fail'
  }

  /**
   * Check if this screen has been printed to console.
   * Static screens in non-TUI modes are considered printed as they print incrementally.
   */
  hasPrintedToConsole(): boolean {
    // If already fully printed, return true
    if (this.hasPrinted) return true

    // Static screens in non-TUI modes print incrementally, so they're considered "printed"
    // as their messages are output immediately when added
    if (this.status === 'static' && !this.manager?.hasTuiRenderer()) {
      return true
    }

    return false
  }

  /**
   * Force print to console (called when TUI unbinds)
   */
  _flushToConsole(force: boolean = false): void {
    if (!this.hasPrinted && (this.isComplete() || force)) {
      this.printToConsole()
    }
  }

  /**
   * Get all messages for rendering
   */
  getMessages(): MessageData[] {
    return [...this.messages]
  }

  /**
   * Add a message to the screen (internal use by Logger)
   */
  addMessage(message: MessageData): void {
    this.messages.push(message)
    this.incrementVersion()

    // In non-TUI modes, static screens print messages immediately
    if (this.status === 'static' && !this.manager?.hasTuiRenderer()) {
      this.printSingleMessageToConsole(message)
    }

    this.emit('message:added', message.id)
  }

  /**
   * Update a loading message (internal use by Logger)
   */
  updateMessage(id: string, updates: Partial<LoadingMessageData>): void {
    const index = this.messages.findIndex((m) => m.id === id)
    if (index !== -1) {
      const oldMessage = this.messages[index] as LoadingMessageData
      this.messages[index] = {
        ...this.messages[index],
        ...updates,
      } as MessageData
      this.incrementVersion()

      // In non-TUI modes for static screens, print when loading completes
      if (this.status === 'static' && !this.manager?.hasTuiRenderer()) {
        const newMessage = this.messages[index] as LoadingMessageData
        // Only print when transitioning from 'loading' to 'success'/'fail'
        if (newMessage.status !== 'loading' && oldMessage.status === 'loading') {
          this.printSingleMessageToConsole(newMessage)
        }
      }

      this.emit('message:updated', id)
    }
  }

  /**
   * Update a progress message (internal use by Logger)
   */
  updateProgressMessage(id: string, updates: Partial<ProgressMessageData>): void {
    const index = this.messages.findIndex((m) => m.id === id)
    if (index !== -1) {
      const oldMessage = this.messages[index] as ProgressMessageData
      this.messages[index] = {
        ...this.messages[index],
        ...updates,
      } as MessageData
      this.incrementVersion()

      // In non-TUI modes for static screens, print when progress completes
      if (this.status === 'static' && !this.manager?.hasTuiRenderer()) {
        const newMessage = this.messages[index] as ProgressMessageData
        if (
          (newMessage.status === 'complete' || newMessage.status === 'failed') &&
          oldMessage.status !== 'complete' &&
          oldMessage.status !== 'failed'
        ) {
          this.printSingleMessageToConsole(newMessage)
        }
      }

      this.emit('message:updated', id)
    }
  }

  /**
   * Clear all messages
   */
  clear(): this {
    this.messages = []
    this.incrementVersion()
    this.emit('messages:cleared')
    return this
  }

  // ============================================
  // Prompt Methods
  // ============================================

  /**
   * Add a prompt to the queue (internal use by Prompt class)
   * Returns a promise that resolves when the user responds
   */
  _addPrompt(prompt: PromptData): Promise<string | boolean | string[]> {
    return new Promise((resolve) => {
      const mode = this.manager?.getRenderMode() ?? RenderMode.UNBOUND

      // UNBOUND mode: return defaults immediately (no interaction possible)
      if (mode === RenderMode.UNBOUND) {
        this.resolvePromptWithDefault(prompt, resolve)
        return
      }

      // STDOUT modes (STDOUT_INTERACTIVE, STDOUT_FALLBACK): use readline for interactive prompts
      if (mode === RenderMode.STDOUT_INTERACTIVE || mode === RenderMode.STDOUT_FALLBACK) {
        this.manager?.handleReadlinePrompt(prompt).then(resolve)
        return
      }

      // TUI_ACTIVE mode: use TUI prompt queue system
      const pending: PendingPrompt = { data: prompt, resolve }

      // Set up timeout if specified
      if (prompt.timeout && prompt.timeoutStarted) {
        pending.timeoutId = setTimeout(() => {
          if (this.activePrompt === pending) {
            this.resolvePromptWithDefault(prompt, resolve)
            this.activePrompt = null
            this.activateNextPrompt()
            this.incrementVersion()
            this.emit('prompt:resolved')
          } else {
            // Remove from queue if not yet active
            const idx = this.promptQueue.indexOf(pending)
            if (idx !== -1) {
              this.promptQueue.splice(idx, 1)
              this.resolvePromptWithDefault(prompt, resolve)
              this.incrementVersion()
            }
          }
        }, prompt.timeout)
      }

      // Add to queue
      this.promptQueue.push(pending)

      // If no active prompt, activate this one
      if (!this.activePrompt) {
        this.activateNextPrompt()
      }
    })
  }

  /**
   * Resolve a prompt with its default value
   */
  private resolvePromptWithDefault(
    prompt: PromptData,
    resolve: (value: string | boolean | string[]) => void,
  ): void {
    resolve(getPromptDefaultValue(prompt))
  }

  /**
   * Get the currently active prompt (for rendering)
   */
  getActivePrompt(): PromptData | null {
    return this.activePrompt?.data ?? null
  }

  /**
   * Check if this screen has an active prompt
   */
  hasActivePrompt(): boolean {
    return this.activePrompt !== null
  }

  /**
   * Update prompt selection (for keyboard navigation)
   */
  updatePromptSelection(index: number): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice') {
      const maxIndex = prompt.choices.length - 1
      ;(prompt as ChoicePromptData).selectedIndex = Math.max(0, Math.min(index, maxIndex))
    } else if (prompt.type === 'multiChoice') {
      const maxIndex = prompt.choices.length - 1
      ;(prompt as MultiChoicePromptData).focusedIndex = Math.max(0, Math.min(index, maxIndex))
    } else if (prompt.type === 'confirm') {
      ;(prompt as ConfirmPromptData).selectedValue = index === 0
    }
    this.emit('prompt:updated')
  }

  /**
   * Navigate prompt selection up
   */
  promptNavigateUp(): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice') {
      this.updatePromptSelection(prompt.selectedIndex - 1)
    } else if (prompt.type === 'multiChoice') {
      this.updatePromptSelection(prompt.focusedIndex - 1)
    } else if (prompt.type === 'confirm') {
      this.updatePromptSelection(prompt.selectedValue ? 0 : 1)
    }
  }

  /**
   * Navigate prompt selection down
   */
  promptNavigateDown(): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice') {
      this.updatePromptSelection(prompt.selectedIndex + 1)
    } else if (prompt.type === 'multiChoice') {
      this.updatePromptSelection(prompt.focusedIndex + 1)
    } else if (prompt.type === 'confirm') {
      this.updatePromptSelection(prompt.selectedValue ? 0 : 1)
    }
  }

  /**
   * Toggle left/right for confirm prompts
   */
  promptNavigateLeft(): void {
    if (!this.activePrompt) return
    const prompt = this.activePrompt.data
    if (prompt.type === 'confirm') {
      ;(prompt as ConfirmPromptData).selectedValue = true
      this.emit('prompt:updated')
    }
  }

  promptNavigateRight(): void {
    if (!this.activePrompt) return
    const prompt = this.activePrompt.data
    if (prompt.type === 'confirm') {
      ;(prompt as ConfirmPromptData).selectedValue = false
      this.emit('prompt:updated')
    }
  }

  /**
   * Toggle selection for multiChoice prompts
   */
  promptToggleSelection(): void {
    if (!this.activePrompt) return
    const prompt = this.activePrompt.data
    if (prompt.type === 'multiChoice') {
      const p = prompt as MultiChoicePromptData
      if (p.selectedIndices.has(p.focusedIndex)) {
        p.selectedIndices.delete(p.focusedIndex)
      } else if (p.selectedIndices.size < p.maxSelect) {
        p.selectedIndices.add(p.focusedIndex)
      }
      this.emit('prompt:updated')
    }
  }

  /**
   * Enter input mode for choice prompts (if current selection allows input)
   * or for input prompts (always)
   */
  promptEnterInputMode(): boolean {
    if (!this.activePrompt) return false

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice') {
      const choice = prompt.choices[prompt.selectedIndex]
      if (choice?.input) {
        ;(prompt as ChoicePromptData).inputMode = true
        this.emit('prompt:updated')
        return true
      }
    } else if (prompt.type === 'input') {
      // Input prompts are always in input mode
      return true
    }
    return false
  }

  /**
   * Exit input mode for choice prompts
   */
  promptExitInputMode(): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice' && prompt.inputMode) {
      ;(prompt as ChoicePromptData).inputMode = false
      this.emit('prompt:updated')
    }
    // Input prompts cannot exit input mode
  }

  /**
   * Check if prompt is in input mode
   */
  isPromptInInputMode(): boolean {
    if (!this.activePrompt) return false
    const prompt = this.activePrompt.data
    if (prompt.type === 'choice') {
      return prompt.inputMode
    }
    if (prompt.type === 'input') {
      return true // Input prompts are always in input mode
    }
    return false
  }

  /**
   * Update input value for choice prompts
   */
  promptUpdateInput(value: string): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice' && prompt.inputMode) {
      ;(prompt as ChoicePromptData).inputValue = value
      this.emit('prompt:updated')
    } else if (prompt.type === 'input') {
      ;(prompt as InputPromptData).value = value
      this.emit('prompt:updated')
    }
  }

  /**
   * Append character to input
   */
  promptAppendInput(char: string): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice' && prompt.inputMode) {
      ;(prompt as ChoicePromptData).inputValue += char
      this.emit('prompt:updated')
    } else if (prompt.type === 'input') {
      ;(prompt as InputPromptData).value += char
      this.emit('prompt:updated')
    }
  }

  /**
   * Delete last character from input
   */
  promptDeleteLastChar(): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data
    if (prompt.type === 'choice' && prompt.inputMode) {
      ;(prompt as ChoicePromptData).inputValue = prompt.inputValue.slice(0, -1)
      this.emit('prompt:updated')
    } else if (prompt.type === 'input') {
      ;(prompt as InputPromptData).value = prompt.value.slice(0, -1)
      this.emit('prompt:updated')
    }
  }

  /**
   * Check if multiChoice prompt can be submitted (meets minSelect requirement)
   */
  canSubmitPrompt(): boolean {
    if (!this.activePrompt) return false
    const prompt = this.activePrompt.data
    if (prompt.type === 'multiChoice') {
      return prompt.selectedIndices.size >= prompt.minSelect
    }
    return true
  }

  /**
   * Submit the current prompt selection
   */
  promptSubmit(): void {
    if (!this.activePrompt) return

    const prompt = this.activePrompt.data

    // Check if can submit (for multiChoice min selection)
    if (!this.canSubmitPrompt()) return

    prompt.resolved = true

    // Clear timeout if any
    if (this.activePrompt.timeoutId) {
      clearTimeout(this.activePrompt.timeoutId)
    }

    switch (prompt.type) {
      case 'choice': {
        const choice = prompt.choices[prompt.selectedIndex]
        const value = choice?.input && prompt.inputValue ? prompt.inputValue : (choice?.value ?? '')
        ;(prompt as ChoicePromptData).resolvedValue = value
        this.activePrompt.resolve(value)
        break
      }
      case 'confirm': {
        ;(prompt as ConfirmPromptData).resolvedValue = prompt.selectedValue
        this.activePrompt.resolve(prompt.selectedValue)
        break
      }
      case 'input': {
        ;(prompt as InputPromptData).resolvedValue = prompt.value
        this.activePrompt.resolve(prompt.value)
        break
      }
      case 'multiChoice': {
        const values = prompt.choices
          .filter((_, i) => prompt.selectedIndices.has(i))
          .map((c) => c.value)
        ;(prompt as MultiChoicePromptData).resolvedValues = values
        this.activePrompt.resolve(values)
        break
      }
    }

    // Move to next prompt
    this.activePrompt = null
    this.activateNextPrompt()
    this.incrementVersion()
    this.emit('prompt:resolved')
  }

  /**
   * Activate the next prompt in the queue
   */
  private activateNextPrompt(): void {
    if (this.promptQueue.length > 0) {
      this.activePrompt = this.promptQueue.shift()!
      // Notify manager to focus this screen
      this.manager?.onScreenPromptActivated(this)
      this.incrementVersion()
      this.emit('prompt:activated')
    }
  }

  /**
   * Print a single message immediately to stdout (for static screens in stdout mode)
   */
  private printSingleMessageToConsole(message: MessageData): void {
    printSingleMessage(message, this.name, false)
  }

  /**
   * Print all messages to stdout/stderr with ANSI colors
   */
  private printToConsole(): void {
    if (this.hasPrinted) return

    const isError = this.status === 'fail'
    if (this.printFn) {
      this.printFn(this.messages, this.name, isError)
      this.hasPrinted = true
    }
  }
}
