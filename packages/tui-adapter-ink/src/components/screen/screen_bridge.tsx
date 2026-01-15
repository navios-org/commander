import { Box, Text } from 'ink'
import { useMemo } from 'react'

import { useTheme } from '../../hooks/index.ts'
import { PromptRenderer } from '../prompt/index.ts'

import type { ScreenInstance, MessageData } from '@navios/commander-tui'

import { GroupRenderer } from './group_renderer.tsx'
import { MessageRenderer } from './message_renderer.tsx'

export interface ScreenBridgeProps {
  screen: ScreenInstance
  focused: boolean
  /** Pre-filtered messages (if filtering is active) */
  filteredMessages?: MessageData[]
  /** Whether any filter is currently active */
  isFiltering?: boolean
  /** Total message count (before filtering) */
  totalMessages?: number
}

// Helper to process messages and organize them into groups
interface ProcessedMessage {
  type: 'single' | 'group'
  message?: MessageData
  label?: string
  messages?: MessageData[]
}

function processMessagesIntoGroups(messages: MessageData[]): ProcessedMessage[] {
  const result: ProcessedMessage[] = []
  let i = 0

  while (i < messages.length) {
    const msg = messages[i]!

    if (msg.type === 'group' && !msg.isEnd) {
      // Start of a group - collect all messages until groupEnd
      const groupLabel = msg.label
      const groupMessages: MessageData[] = []
      i++ // Move past the group start

      while (i < messages.length) {
        const innerMsg = messages[i]!
        if (innerMsg.type === 'group' && innerMsg.isEnd) {
          i++ // Move past the group end
          break
        }
        groupMessages.push(innerMsg)
        i++
      }

      result.push({
        type: 'group',
        label: groupLabel,
        messages: groupMessages,
      })
    } else if (msg.type === 'group' && msg.isEnd) {
      // Stray group end - skip it
      i++
    } else {
      // Regular message
      result.push({ type: 'single', message: msg })
      i++
    }
  }

  return result
}

/**
 * Screen content renderer.
 * This is a pure component that receives all data via props.
 * Parent (ContentArea) manages subscriptions and re-renders this when data changes.
 */
export function ScreenBridge({
  screen,
  focused,
  filteredMessages,
  isFiltering,
  totalMessages,
}: ScreenBridgeProps) {
  const theme = useTheme()

  // Use filtered messages if provided, otherwise get from screen
  const messages = filteredMessages ?? screen.getMessages()
  const activePrompt = screen.getActivePrompt()
  const processedMessages = useMemo(() => processMessagesIntoGroups(messages), [messages])

  // Calculate filter stats
  const filteredCount = messages.length
  const total = totalMessages ?? messages.length
  const showFilterStatus = isFiltering && filteredCount !== total

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Screen header */}
      <Box
        backgroundColor={theme.header.background}
        borderStyle="single"
        borderBottom
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderColor={focused ? theme.sidebar.focusBorder : theme.header.border}
        paddingLeft={1}
        paddingRight={1}
        justifyContent="space-between"
      >
        <Text color={theme.header.text} bold>
          {screen.getName()}
        </Text>
        {showFilterStatus && (
          <Text color={theme.sidebar.textDim}>
            {filteredCount}/{total} messages
          </Text>
        )}
      </Box>

      {/* Virtualized scrollable content area */}
      <Box flexDirection="column" flexGrow={1} paddingLeft={1} paddingRight={1}>
        {processedMessages.map((item, index) => {
          const key = `item-${index}`
          if (item.type === 'group') {
            return (
              <Box key={key} marginBottom={1}>
                <GroupRenderer label={item.label!} messages={item.messages!} />
              </Box>
            )
          } else {
            return (
              <Box key={key} marginBottom={1}>
                <MessageRenderer message={item.message!} />
              </Box>
            )
          }
        })}

        {/* Render active prompt at the end of messages */}
        {activePrompt && <PromptRenderer prompt={activePrompt} />}
      </Box>
    </Box>
  )
}
