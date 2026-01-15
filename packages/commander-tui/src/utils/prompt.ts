import type { PromptData } from '../types/prompt.types.ts'

/**
 * Get the default value for a prompt based on its type.
 * Used for resolving prompts when no interaction is possible.
 */
export function getPromptDefaultValue(prompt: PromptData): string | boolean | string[] {
  switch (prompt.type) {
    case 'choice':
      return prompt.defaultChoice
    case 'confirm':
      return prompt.defaultValue
    case 'input':
      return prompt.defaultValue
    case 'multiChoice':
      return prompt.choices.filter((_, i) => prompt.selectedIndices.has(i)).map((c) => c.value)
  }
}
