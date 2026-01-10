// ============================================
// Prompt Data Types
// ============================================

export interface ChoiceOption {
  label: string
  value: string
  /** If true, this option allows text input */
  input?: boolean
}

export interface BasePromptData {
  id: string
  timestamp: Date
  resolved: boolean
  /** Auto-resolve timeout in ms */
  timeout?: number
  /** Timestamp when timeout started */
  timeoutStarted?: number
}

export interface ChoicePromptData extends BasePromptData {
  type: 'choice'
  question: string
  choices: ChoiceOption[]
  defaultChoice: string
  selectedIndex: number
  inputMode: boolean
  inputValue: string
  resolvedValue?: string
}

export interface ConfirmPromptData extends BasePromptData {
  type: 'confirm'
  question: string
  confirmText: string
  cancelText: string
  defaultValue: boolean
  selectedValue: boolean
  resolvedValue?: boolean
}

export interface InputPromptData extends BasePromptData {
  type: 'input'
  question: string
  placeholder: string
  defaultValue: string
  value: string
  resolvedValue?: string
}

export interface MultiChoicePromptData extends BasePromptData {
  type: 'multiChoice'
  question: string
  choices: ChoiceOption[]
  selectedIndices: Set<number>
  focusedIndex: number
  minSelect: number
  maxSelect: number
  resolvedValues?: string[]
}

export type PromptData =
  | ChoicePromptData
  | ConfirmPromptData
  | InputPromptData
  | MultiChoicePromptData

// ============================================
// Prompt Options Types
// ============================================

export interface ChoiceOptions {
  question: string
  choices: ChoiceOption[]
  defaultChoice?: string
  /** Auto-resolve with default after timeout (ms) */
  timeout?: number
}

export interface ConfirmOptions {
  question: string
  confirmText?: string
  cancelText?: string
  defaultValue?: boolean
  /** Auto-resolve with default after timeout (ms) */
  timeout?: number
}

export interface InputOptions {
  question: string
  placeholder?: string
  defaultValue?: string
  /** Auto-resolve with default after timeout (ms) */
  timeout?: number
}

export interface MultiChoiceOptions {
  question: string
  choices: ChoiceOption[]
  defaultChoices?: string[]
  minSelect?: number
  maxSelect?: number
  /** Auto-resolve with default after timeout (ms) */
  timeout?: number
}
