import { TextAttributes } from '@opentui/core'
import { Show, For, Switch, Match } from 'solid-js'

import { useTheme } from '../../hooks/index.ts'

import type {
  PromptData,
  ChoicePromptData,
  ConfirmPromptData,
  InputPromptData,
  MultiChoicePromptData,
  PromptTheme,
} from '../../../../types/index.ts'

export interface PromptRendererProps {
  prompt: PromptData
}

export function PromptRenderer(props: PromptRendererProps) {
  const theme = useTheme()
  // Calculate timeout remaining if applicable
  const timeoutRemaining = () => getTimeoutRemaining(props.prompt)

  return (
    <Switch fallback={null}>
      <Match when={props.prompt.type === 'choice'}>
        <ChoicePromptRenderer
          prompt={props.prompt as ChoicePromptData}
          timeoutRemaining={timeoutRemaining()}
          colors={theme.prompt}
        />
      </Match>
      <Match when={props.prompt.type === 'confirm'}>
        <ConfirmPromptRenderer
          prompt={props.prompt as ConfirmPromptData}
          timeoutRemaining={timeoutRemaining()}
          colors={theme.prompt}
        />
      </Match>
      <Match when={props.prompt.type === 'input'}>
        <InputPromptRenderer
          prompt={props.prompt as InputPromptData}
          timeoutRemaining={timeoutRemaining()}
          colors={theme.prompt}
        />
      </Match>
      <Match when={props.prompt.type === 'multiChoice'}>
        <MultiChoicePromptRenderer
          prompt={props.prompt as MultiChoicePromptData}
          timeoutRemaining={timeoutRemaining()}
          colors={theme.prompt}
        />
      </Match>
    </Switch>
  )
}

function getTimeoutRemaining(prompt: PromptData): number | null {
  if (!prompt.timeout || !prompt.timeoutStarted) return null
  const elapsed = Date.now() - prompt.timeoutStarted
  const remaining = Math.max(0, prompt.timeout - elapsed)
  return Math.ceil(remaining / 1000)
}

function TimeoutIndicator(props: { seconds: number | null; colors: PromptTheme }) {
  return (
    <Show when={props.seconds !== null}>
      <text fg={props.colors.optionTextDim} attributes={TextAttributes.DIM}>
        {' '}
        (auto-select in {props.seconds}s)
      </text>
    </Show>
  )
}

interface ChoicePromptRendererProps {
  prompt: ChoicePromptData
  timeoutRemaining: number | null
  colors: PromptTheme
}

function ChoicePromptRenderer(props: ChoicePromptRendererProps) {
  return (
    <box
      flexDirection="column"
      borderColor={props.colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={props.colors.question} attributes={TextAttributes.BOLD}>
          ? {props.prompt.question}
        </text>
        <TimeoutIndicator seconds={props.timeoutRemaining} colors={props.colors} />
      </box>

      {/* Choices */}
      <box flexDirection="column">
        <For each={props.prompt.choices}>
          {(choice, index) => {
            const isSelected = () => index() === props.prompt.selectedIndex
            const showInput = () => isSelected() && choice.input && props.prompt.inputMode

            return (
              <box flexDirection="row">
                {/* Selection indicator */}
                <text fg={isSelected() ? props.colors.optionSelected : 'transparent'}>{'>'} </text>

                {/* Choice label */}
                <text
                  fg={isSelected() ? props.colors.optionText : props.colors.optionTextDim}
                  attributes={isSelected() ? TextAttributes.BOLD : undefined}
                >
                  {choice.label}
                </text>

                {/* Input field (if applicable) */}
                <Show when={showInput()}>
                  <box flexDirection="row" marginLeft={1}>
                    <text fg={props.colors.inputText}>: </text>
                    <text fg={props.colors.inputText}>{props.prompt.inputValue}</text>
                    <text fg={props.colors.inputCursor} attributes={TextAttributes.BLINK}>
                      _
                    </text>
                  </box>
                </Show>

                {/* Show hint for input option when selected but not in input mode */}
                <Show when={isSelected() && choice.input && !props.prompt.inputMode}>
                  <text fg={props.colors.optionTextDim}> (press Enter to type)</text>
                </Show>
              </box>
            )
          }}
        </For>
      </box>

      {/* Instructions */}
      <Show
        when={props.prompt.inputMode}
        fallback={
          <text fg={props.colors.optionTextDim} attributes={TextAttributes.DIM}>
            ↑/↓ to navigate, Enter to select
          </text>
        }
      >
        <text fg={props.colors.optionTextDim} attributes={TextAttributes.DIM}>
          Type your answer, Enter to submit, Esc to cancel
        </text>
      </Show>
    </box>
  )
}

interface ConfirmPromptRendererProps {
  prompt: ConfirmPromptData
  timeoutRemaining: number | null
  colors: PromptTheme
}

function ConfirmPromptRenderer(props: ConfirmPromptRendererProps) {
  const confirmSelected = () => props.prompt.selectedValue === true
  const cancelSelected = () => props.prompt.selectedValue === false

  return (
    <box
      flexDirection="column"
      borderColor={props.colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={props.colors.question} attributes={TextAttributes.BOLD}>
          ? {props.prompt.question}
        </text>
        <TimeoutIndicator seconds={props.timeoutRemaining} colors={props.colors} />
      </box>

      {/* Buttons */}
      <box flexDirection="row" gap={2}>
        {/* Confirm button */}
        <box
          backgroundColor={confirmSelected() ? props.colors.buttonSelectedBackground : undefined}
          paddingLeft={1}
          paddingRight={1}
        >
          <text
            fg={confirmSelected() ? props.colors.confirmButton : props.colors.optionTextDim}
            attributes={confirmSelected() ? TextAttributes.BOLD : undefined}
          >
            {confirmSelected() ? '>' : ' '} {props.prompt.confirmText}
          </text>
        </box>

        {/* Cancel button */}
        <box
          backgroundColor={cancelSelected() ? props.colors.buttonSelectedBackground : undefined}
          paddingLeft={1}
          paddingRight={1}
        >
          <text
            fg={cancelSelected() ? props.colors.cancelButton : props.colors.optionTextDim}
            attributes={cancelSelected() ? TextAttributes.BOLD : undefined}
          >
            {cancelSelected() ? '>' : ' '} {props.prompt.cancelText}
          </text>
        </box>
      </box>

      {/* Instructions */}
      <text fg={props.colors.optionTextDim} attributes={TextAttributes.DIM}>
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

function InputPromptRenderer(props: InputPromptRendererProps) {
  const hasValue = () => props.prompt.value.length > 0

  return (
    <box
      flexDirection="column"
      borderColor={props.colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={props.colors.question} attributes={TextAttributes.BOLD}>
          ? {props.prompt.question}
        </text>
        <TimeoutIndicator seconds={props.timeoutRemaining} colors={props.colors} />
      </box>

      {/* Input field */}
      <box flexDirection="row" borderColor={props.colors.inputBorder} border={['left']} paddingLeft={1}>
        <text fg={hasValue() ? props.colors.inputText : props.colors.inputPlaceholder}>
          {hasValue() ? props.prompt.value : props.prompt.placeholder}
        </text>
        <text fg={props.colors.inputCursor} attributes={TextAttributes.BLINK}>
          _
        </text>
      </box>

      {/* Instructions */}
      <text fg={props.colors.optionTextDim} attributes={TextAttributes.DIM}>
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

function MultiChoicePromptRenderer(props: MultiChoicePromptRendererProps) {
  const selectedCount = () => props.prompt.selectedIndices.size
  const canSubmit = () => selectedCount() >= props.prompt.minSelect

  return (
    <box
      flexDirection="column"
      borderColor={props.colors.focusBorder}
      border={['left']}
      paddingLeft={1}
      paddingRight={1}
      gap={1}
    >
      {/* Question */}
      <box flexDirection="row">
        <text fg={props.colors.question} attributes={TextAttributes.BOLD}>
          ? {props.prompt.question}
        </text>
        <text fg={props.colors.optionTextDim}>
          {' '}
          ({selectedCount()}/{props.prompt.maxSelect} selected)
        </text>
        <TimeoutIndicator seconds={props.timeoutRemaining} colors={props.colors} />
      </box>

      {/* Choices */}
      <box flexDirection="column">
        <For each={props.prompt.choices}>
          {(choice, index) => {
            const isFocused = () => index() === props.prompt.focusedIndex
            const isChecked = () => props.prompt.selectedIndices.has(index())

            return (
              <box flexDirection="row">
                {/* Focus indicator */}
                <text fg={isFocused() ? props.colors.optionSelected : 'transparent'}>{'>'} </text>

                {/* Checkbox */}
                <text fg={isChecked() ? props.colors.optionSelected : props.colors.optionTextDim}>
                  {isChecked() ? '[✓]' : '[ ]'}{' '}
                </text>

                {/* Choice label */}
                <text
                  fg={isFocused() ? props.colors.optionText : props.colors.optionTextDim}
                  attributes={isFocused() ? TextAttributes.BOLD : undefined}
                >
                  {choice.label}
                </text>
              </box>
            )
          }}
        </For>
      </box>

      {/* Instructions */}
      <box flexDirection="column">
        <text fg={props.colors.optionTextDim} attributes={TextAttributes.DIM}>
          ↑/↓ to navigate, Space to toggle
        </text>
        <Show
          when={canSubmit()}
          fallback={
            <text fg={props.colors.cancelButton} attributes={TextAttributes.DIM}>
              Select at least {props.prompt.minSelect} option
              {props.prompt.minSelect > 1 ? 's' : ''}
            </text>
          }
        >
          <text fg={props.colors.optionTextDim} attributes={TextAttributes.DIM}>
            Enter to confirm
          </text>
        </Show>
      </box>
    </box>
  )
}
