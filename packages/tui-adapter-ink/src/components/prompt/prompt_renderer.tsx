import { Box, Text } from 'ink'

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
    <Text color={colors.optionTextDim} dimColor>
      {' '}
      (auto-select in {seconds}s)
    </Text>
  )
}

interface ChoicePromptRendererProps {
  prompt: ChoicePromptData
  timeoutRemaining: number | null
  colors: PromptTheme
}

function ChoicePromptRenderer({ prompt, timeoutRemaining, colors }: ChoicePromptRendererProps) {
  return (
    <Box flexDirection="row">
      {/* Left border indicator */}
      <Text color={colors.focusBorder}>│</Text>

      {/* Content area */}
      <Box flexDirection="column" paddingLeft={1} paddingRight={1} gap={1}>
        {/* Question */}
        <Box flexDirection="row">
          <Text color={colors.question} bold>
            ? {prompt.question}
          </Text>
          <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
        </Box>

        {/* Choices */}
        <Box flexDirection="column">
          {prompt.choices.map((choice, index) => {
            const isSelected = index === prompt.selectedIndex
            const showInput = isSelected && choice.input && prompt.inputMode

            return (
              <Box key={choice.value} flexDirection="row">
                {/* Selection indicator */}
                <Text color={isSelected ? colors.optionSelected : undefined}>
                  {isSelected ? '> ' : '  '}
                </Text>

                {/* Choice label */}
                <Text
                  color={isSelected ? colors.optionText : colors.optionTextDim}
                  bold={isSelected}
                >
                  {choice.label}
                </Text>

                {/* Input field (if applicable) */}
                {showInput && (
                  <Box flexDirection="row" marginLeft={1}>
                    <Text color={colors.inputText}>: </Text>
                    <Text color={colors.inputText}>{prompt.inputValue}</Text>
                    <Text color={colors.inputCursor}>_</Text>
                  </Box>
                )}

                {/* Show hint for input option when selected but not in input mode */}
                {isSelected && choice.input && !prompt.inputMode && (
                  <Text color={colors.optionTextDim}> (press Enter to type)</Text>
                )}
              </Box>
            )
          })}
        </Box>

        {/* Instructions */}
        {prompt.inputMode ? (
          <Text color={colors.optionTextDim} dimColor>
            Type your answer, Enter to submit, Esc to cancel
          </Text>
        ) : (
          <Text color={colors.optionTextDim} dimColor>
            ↑/↓ to navigate, Enter to select
          </Text>
        )}
      </Box>
    </Box>
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
    <Box flexDirection="row">
      {/* Left border indicator */}
      <Text color={colors.focusBorder}>│</Text>

      {/* Content area */}
      <Box flexDirection="column" paddingLeft={1} paddingRight={1} gap={1}>
        {/* Question */}
        <Box flexDirection="row">
          <Text color={colors.question} bold>
            ? {prompt.question}
          </Text>
          <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
        </Box>

        {/* Buttons */}
        <Box flexDirection="row" gap={2}>
          {/* Confirm button */}
          <Text
            color={confirmSelected ? colors.confirmButton : colors.optionTextDim}
            backgroundColor={confirmSelected ? colors.buttonSelectedBackground : undefined}
            bold={confirmSelected}
          >
            {confirmSelected ? '>' : ' '} {prompt.confirmText}
          </Text>

          {/* Cancel button */}
          <Text
            color={cancelSelected ? colors.cancelButton : colors.optionTextDim}
            backgroundColor={cancelSelected ? colors.buttonSelectedBackground : undefined}
            bold={cancelSelected}
          >
            {cancelSelected ? '>' : ' '} {prompt.cancelText}
          </Text>
        </Box>

        {/* Instructions */}
        <Text color={colors.optionTextDim} dimColor>
          ←/→ to select, Enter to confirm
        </Text>
      </Box>
    </Box>
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
    <Box flexDirection="row">
      {/* Left border indicator */}
      <Text color={colors.focusBorder}>│</Text>

      {/* Content area */}
      <Box flexDirection="column" paddingLeft={1} paddingRight={1} gap={1}>
        {/* Question */}
        <Box flexDirection="row">
          <Text color={colors.question} bold>
            ? {prompt.question}
          </Text>
          <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
        </Box>

        {/* Input field */}
        <Box flexDirection="row">
          <Text color={colors.inputBorder}>│ </Text>
          <Text color={hasValue ? colors.inputText : colors.inputPlaceholder}>
            {hasValue ? prompt.value : prompt.placeholder}
          </Text>
          <Text color={colors.inputCursor}>_</Text>
        </Box>

        {/* Instructions */}
        <Text color={colors.optionTextDim} dimColor>
          Type your answer, Enter to submit
        </Text>
      </Box>
    </Box>
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
    <Box flexDirection="row">
      {/* Left border indicator */}
      <Text color={colors.focusBorder}>│</Text>

      {/* Content area */}
      <Box flexDirection="column" paddingLeft={1} paddingRight={1} gap={1}>
        {/* Question */}
        <Box flexDirection="row">
          <Text color={colors.question} bold>
            ? {prompt.question}
          </Text>
          <Text color={colors.optionTextDim}>
            {' '}
            ({selectedCount}/{prompt.maxSelect} selected)
          </Text>
          <TimeoutIndicator seconds={timeoutRemaining} colors={colors} />
        </Box>

        {/* Choices */}
        <Box flexDirection="column">
          {prompt.choices.map((choice, index) => {
            const isFocused = index === prompt.focusedIndex
            const isChecked = prompt.selectedIndices.has(index)

            return (
              <Box key={choice.value} flexDirection="row">
                {/* Focus indicator */}
                <Text color={isFocused ? colors.optionSelected : undefined}>
                  {isFocused ? '> ' : '  '}
                </Text>

                {/* Checkbox */}
                <Text color={isChecked ? colors.optionSelected : colors.optionTextDim}>
                  {isChecked ? '[✓]' : '[ ]'}{' '}
                </Text>

                {/* Choice label */}
                <Text color={isFocused ? colors.optionText : colors.optionTextDim} bold={isFocused}>
                  {choice.label}
                </Text>
              </Box>
            )
          })}
        </Box>

        {/* Instructions */}
        <Box flexDirection="column">
          <Text color={colors.optionTextDim} dimColor>
            ↑/↓ to navigate, Space to toggle
          </Text>
          {canSubmit ? (
            <Text color={colors.optionTextDim} dimColor>
              Enter to confirm
            </Text>
          ) : (
            <Text color={colors.cancelButton} dimColor>
              Select at least {prompt.minSelect} option
              {prompt.minSelect > 1 ? 's' : ''}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}
