import { Box, Text } from 'ink'

import { useTheme } from '../../hooks/index.ts'

import type { ProgressMessageData } from '../../../../types/index.ts'

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

  const barColor =
    message.status === 'complete'
      ? theme.progress.complete
      : message.status === 'failed'
        ? theme.progress.failed
        : theme.progress.barFilled

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
