import type { ProgressMessageData, ScreenInstance } from '@navios/commander-tui'

import { useTheme, useProgressMessageUpdate } from '../../hooks/index.ts'

export interface ProgressMessageProps {
  message: ProgressMessageData
  screen: ScreenInstance
}

interface StatusColors {
  border: string
  background: string
  bar: string
}

function getStatusColors(
  status: ProgressMessageData['status'],
  theme: {
    complete: string
    failed: string
    border: string
    barFilled: string
    background: string
    completeBackground: string
    failedBackground: string
  },
): StatusColors {
  switch (status) {
    case 'complete':
      return {
        border: theme.complete,
        background: theme.completeBackground,
        bar: theme.complete,
      }
    case 'failed':
      return {
        border: theme.failed,
        background: theme.failedBackground,
        bar: theme.failed,
      }
    default:
      return {
        border: theme.border,
        background: theme.background,
        bar: theme.barFilled,
      }
  }
}

/**
 * Progress message component that subscribes to its own update events.
 * This allows it to re-render only when this specific message is updated.
 */
export function ProgressMessage({ message: initialMessage, screen }: ProgressMessageProps) {
  // Subscribe to updates for this specific message
  const message = useProgressMessageUpdate(screen, initialMessage.id, initialMessage)

  const theme = useTheme()
  const percent = Math.round((message.current / message.total) * 100)
  const barWidth = 20
  const filled = Math.round((percent / 100) * barWidth)
  const empty = barWidth - filled

  const barFilled = '█'.repeat(filled)
  const barEmpty = '░'.repeat(empty)

  const colors = getStatusColors(message.status, theme.progress)
  const displayLabel = message.resolvedContent ?? message.label

  return (
    <box
      flexDirection="column"
      border={['left']}
      borderColor={colors.border}
      backgroundColor={colors.background}
      paddingLeft={1}
      paddingRight={1}
    >
      <box flexDirection="row" gap={1}>
        <text fg={colors.bar}>[{barFilled}</text>
        <text fg={theme.progress.barEmpty}>{barEmpty}]</text>
        <text fg={theme.progress.textDim}>{percent}%</text>
        <text fg={theme.progress.text}>{displayLabel}</text>
      </box>
    </box>
  )
}
