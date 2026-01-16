import { Box, Text } from 'ink'

import type { ProgressMessageData, ScreenInstance } from '@navios/commander-tui'

import { useTheme, useProgressMessageUpdate } from '../../hooks/index.ts'

export interface ProgressMessageProps {
  message: ProgressMessageData
  screen: ScreenInstance
}

function getStatusColor(
  status: ProgressMessageData['status'],
  theme: { complete: string; failed: string; border: string; barFilled: string },
  defaultKey: 'border' | 'barFilled',
): string {
  switch (status) {
    case 'complete':
      return theme.complete
    case 'failed':
      return theme.failed
    default:
      return theme[defaultKey]
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

  const borderColor = getStatusColor(message.status, theme.progress, 'border')
  const barColor = getStatusColor(message.status, theme.progress, 'barFilled')
  const displayLabel = message.resolvedContent ?? message.label

  return (
    <Box flexDirection="row">
      {/* Left border indicator */}
      <Text color={borderColor}>│</Text>

      {/* Content area */}
      <Box flexDirection="row" gap={1} paddingLeft={1} paddingRight={1}>
        <Text color={barColor}>[{barFilled}</Text>
        <Text color={theme.progress.barEmpty}>{barEmpty}]</Text>
        <Text color={theme.progress.textDim}>{percent}%</Text>
        <Text color={theme.progress.text}>{displayLabel}</Text>
      </Box>
    </Box>
  )
}
