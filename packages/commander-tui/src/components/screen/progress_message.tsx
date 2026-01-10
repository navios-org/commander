import { useTheme } from '../../hooks/index.ts'

import type { ProgressMessageData } from '../../types/index.ts'

export interface ProgressMessageProps {
  message: ProgressMessageData
}

export function ProgressMessage({ message }: ProgressMessageProps) {
  const theme = useTheme()
  const percent = Math.round((message.current / message.total) * 100)
  const barWidth = 20
  const filled = Math.round((percent / 100) * barWidth)
  const empty = barWidth - filled

  const barFilled = '█'.repeat(filled)
  const barEmpty = '░'.repeat(empty)

  // Determine colors based on status
  const borderColor =
    message.status === 'complete'
      ? theme.progress.complete
      : message.status === 'failed'
        ? theme.progress.failed
        : theme.progress.border

  const backgroundColor =
    message.status === 'complete'
      ? theme.progress.completeBackground
      : message.status === 'failed'
        ? theme.progress.failedBackground
        : theme.progress.background

  const barColor =
    message.status === 'complete'
      ? theme.progress.complete
      : message.status === 'failed'
        ? theme.progress.failed
        : theme.progress.barFilled

  const displayLabel = message.resolvedContent ?? message.label

  return (
    <box
      flexDirection="column"
      border={['left']}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      paddingLeft={1}
      paddingRight={1}
    >
      <box flexDirection="row" gap={1}>
        <text fg={barColor}>[{barFilled}</text>
        <text fg={theme.progress.barEmpty}>{barEmpty}]</text>
        <text fg={theme.progress.textDim}>{percent}%</text>
        <text fg={theme.progress.text}>{displayLabel}</text>
      </box>
    </box>
  )
}
