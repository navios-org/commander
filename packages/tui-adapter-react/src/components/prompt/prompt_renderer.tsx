import { TextAttributes } from '@opentui/core'

import type {
  PromptData,
  ChoicePromptData,
  ConfirmPromptData,
  InputPromptData,
  MultiChoicePromptData,
  PromptTheme,
} from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'

export interface PromptRendererProps {
  prompt: PromptData
}

export function PromptRenderer({ prompt }: PromptRendererProps) {
  const theme = useTheme()
  // Calculate timeout remaining if applicable
  const timeoutRemaining = getTimeoutRemaining(prompt)

  switch (prompt.type) {
    case 'choice':
      return (
        <ChoicePromptRenderer
          prompt={prompt}
          timeoutRemaining={timeoutRemaining}
          colors={theme.prompt}
        />
      )
    case 'confirm':
      return (
        <ConfirmPromptRenderer
          prompt={prompt}
          timeoutRemaining={timeoutRemaining}
          colors={theme.prompt}
        />
      )
    case 'input':
      return (
        <InputPromptRenderer
          prompt={prompt}
          timeoutRemaining={timeoutRemaining}
          colors={theme.prompt}
        />
      )
    case 'multiChoice':
      return (
        <MultiChoicePromptRenderer
          prompt={prompt}
          timeoutRemaining={timeoutRemaining}
          colors={theme.prompt}
        />
      )
    default:
      return null
  }
}

function getTimeoutRemaining(prompt: PromptData): number | null {
  if (!prompt.timeout || !prompt.timeoutStarted) return null
  const elapsed = Date.now() - prompt.timeoutStarted
  const remaining = Math.max(0, prompt.timeout - elapsed)
  return Math.ceil(remaining / 1000)
}

function TimeoutIndicator({ seconds, colors }: { seconds: number | null; colors: PromptTheme }) {
  if (seconds === null) return null
  return (
    <text fg={colors.optionTextDim} attributes={TextAttributes.DIM}>
      {' '}
      (auto-select in {seconds}s)
    </text>
  )
}

interface ChoicePromptRendererProps {
  prompt: ChoicePromptData
  timeoutRemaining: number | null
  colors: PromptTheme
}

function ChoicePromptRenderer({ prompt, timeoutRemaining, colors }: ChoicePromptRendererProps) {
  return (
    <box
      flexDirection="column"
      borderColor={colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={colors.question} attributes={TextAttributes.BOLD}>
          ? {prompt.question}
        </text>
        <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
      </box>

      {/* Choices */}
      <box flexDirection="column">
        {prompt.choices.map((choice, index) => {
          const isSelected = index === prompt.selectedIndex
          const showInput = isSelected && choice.input && prompt.inputMode

          return (
            <box key={choice.value} flexDirection="row">
              {/* Selection indicator */}
              <text fg={isSelected ? colors.optionSelected : 'transparent'}>{'>'} </text>

              {/* Choice label */}
              <text
                fg={isSelected ? colors.optionText : colors.optionTextDim}
                attributes={isSelected ? TextAttributes.BOLD : undefined}
              >
                {choice.label}
              </text>

              {/* Input field (if applicable) */}
              {showInput && (
                <box flexDirection="row" marginLeft={1}>
                  <text fg={colors.inputText}>: </text>
                  <text fg={colors.inputText}>{prompt.inputValue}</text>
                  <text fg={colors.inputCursor} attributes={TextAttributes.BLINK}>
                    _
                  </text>
                </box>
              )}

              {/* Show hint for input option when selected but not in input mode */}
              {isSelected && choice.input && !prompt.inputMode && (
                <text fg={colors.optionTextDim}> (press Enter to type)</text>
              )}
            </box>
          )
        })}
      </box>

      {/* Instructions */}
      {prompt.inputMode ? (
        <text fg={colors.optionTextDim} attributes={TextAttributes.DIM}>
          Type your answer, Enter to submit, Esc to cancel
        </text>
      ) : (
        <text fg={colors.optionTextDim} attributes={TextAttributes.DIM}>
          ↑/↓ to navigate, Enter to select
        </text>
      )}
    </box>
  )
}

interface ConfirmPromptRendererProps {
  prompt: ConfirmPromptData
  timeoutRemaining: number | null
  colors: PromptTheme
}

function ConfirmPromptRenderer({ prompt, timeoutRemaining, colors }: ConfirmPromptRendererProps) {
  const confirmSelected = prompt.selectedValue === true
  const cancelSelected = prompt.selectedValue === false

  return (
    <box
      flexDirection="column"
      borderColor={colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={colors.question} attributes={TextAttributes.BOLD}>
          ? {prompt.question}
        </text>
        <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
      </box>

      {/* Buttons */}
      <box flexDirection="row" gap={2}>
        {/* Confirm button */}
        <box
          backgroundColor={confirmSelected ? colors.buttonSelectedBackground : undefined}
          paddingLeft={1}
          paddingRight={1}
        >
          <text
            fg={confirmSelected ? colors.confirmButton : colors.optionTextDim}
            attributes={confirmSelected ? TextAttributes.BOLD : undefined}
          >
            {confirmSelected ? '>' : ' '} {prompt.confirmText}
          </text>
        </box>

        {/* Cancel button */}
        <box
          backgroundColor={cancelSelected ? colors.buttonSelectedBackground : undefined}
          paddingLeft={1}
          paddingRight={1}
        >
          <text
            fg={cancelSelected ? colors.cancelButton : colors.optionTextDim}
            attributes={cancelSelected ? TextAttributes.BOLD : undefined}
          >
            {cancelSelected ? '>' : ' '} {prompt.cancelText}
          </text>
        </box>
      </box>

      {/* Instructions */}
      <text fg={colors.optionTextDim} attributes={TextAttributes.DIM}>
        ←/→ to select, Enter to confirm
      </text>
    </box>
  )
}

interface InputPromptRendererProps {
  prompt: InputPromptData
  timeoutRemaining: number | null
  colors: PromptTheme
}

function InputPromptRenderer({ prompt, timeoutRemaining, colors }: InputPromptRendererProps) {
  const hasValue = prompt.value.length > 0

  return (
    <box
      flexDirection="column"
      borderColor={colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={colors.question} attributes={TextAttributes.BOLD}>
          ? {prompt.question}
        </text>
        <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
      </box>

      {/* Input field */}
      <box flexDirection="row" borderColor={colors.inputBorder} border={['left']} paddingLeft={1}>
        <text fg={hasValue ? colors.inputText : colors.inputPlaceholder}>
          {hasValue ? prompt.value : prompt.placeholder}
        </text>
        <text fg={colors.inputCursor} attributes={TextAttributes.BLINK}>
          _
        </text>
      </box>

      {/* Instructions */}
      <text fg={colors.optionTextDim} attributes={TextAttributes.DIM}>
        Type your answer, Enter to submit
      </text>
    </box>
  )
}

interface MultiChoicePromptRendererProps {
  prompt: MultiChoicePromptData
  timeoutRemaining: number | null
  colors: PromptTheme
}

function MultiChoicePromptRenderer({
  prompt,
  timeoutRemaining,
  colors,
}: MultiChoicePromptRendererProps) {
  const selectedCount = prompt.selectedIndices.size
  const canSubmit = selectedCount >= prompt.minSelect

  return (
    <box
      flexDirection="column"
      borderColor={colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={colors.question} attributes={TextAttributes.BOLD}>
          ? {prompt.question}
        </text>
        <text fg={colors.optionTextDim}>
          {' '}
          ({selectedCount}/{prompt.maxSelect} selected)
        </text>
        <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
      </box>

      {/* Choices */}
      <box flexDirection="column">
        {prompt.choices.map((choice, index) => {
          const isFocused = index === prompt.focusedIndex
          const isChecked = prompt.selectedIndices.has(index)

          return (
            <box key={choice.value} flexDirection="row">
              {/* Focus indicator */}
              <text fg={isFocused ? colors.optionSelected : 'transparent'}>{'>'} </text>

              {/* Checkbox */}
              <text fg={isChecked ? colors.optionSelected : colors.optionTextDim}>
                {isChecked ? '[✓]' : '[ ]'}{' '}
              </text>

              {/* Choice label */}
              <text
                fg={isFocused ? colors.optionText : colors.optionTextDim}
                attributes={isFocused ? TextAttributes.BOLD : undefined}
              >
                {choice.label}
              </text>
            </box>
          )
        })}
      </box>

      {/* Instructions */}
      <box flexDirection="column">
        <text fg={colors.optionTextDim} attributes={TextAttributes.DIM}>
          ↑/↓ to navigate, Space to toggle
        </text>
        {canSubmit ? (
          <text fg={colors.optionTextDim} attributes={TextAttributes.DIM}>
            Enter to confirm
          </text>
        ) : (
          <text fg={colors.cancelButton} attributes={TextAttributes.DIM}>
            Select at least {prompt.minSelect} option
            {prompt.minSelect > 1 ? 's' : ''}
          </text>
        )}
      </box>
    </box>
  )
}
