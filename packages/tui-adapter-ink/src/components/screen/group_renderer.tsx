import { Box, Text } from 'ink'

import type { MessageData, GroupMessageData } from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'

import { MessageRenderer } from './message_renderer.tsx'

export interface GroupRendererProps {
  label: string
  messages: MessageData[]
}

export function GroupRenderer({ label, messages }: GroupRendererProps) {
  const theme = useTheme()

  return (
    <Box flexDirection="row">
      {/* Left border indicator */}
      <Text color={theme.group.border}>│</Text>

      {/* Content area */}
      <Box flexDirection="column" paddingLeft={1}>
        {/* Group header */}
        <Box flexDirection="row" marginBottom={1}>
          <Text color={theme.group.icon}>▼ </Text>
          <Text color={theme.group.headerText} bold>
            {label}
          </Text>
        </Box>

        {/* Group content */}
        <Box flexDirection="column" gap={1}>
          {messages.map((msg) => (
            <MessageRenderer key={msg.id} message={msg} />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export interface GroupMessageRendererProps {
  message: GroupMessageData
}

/**
 * Fallback renderer for group markers (when not processed at higher level)
 */
export function GroupMessageRenderer({ message }: GroupMessageRendererProps) {
  const theme = useTheme()

  if (message.isEnd) {
    return null
  }

  return (
    <Box flexDirection="row">
      <Text color={theme.group.border}>│</Text>
      <Box paddingLeft={1}>
        <Text color={theme.group.headerText} bold>
          ▼ {message.label}
        </Text>
      </Box>
    </Box>
  )
}
