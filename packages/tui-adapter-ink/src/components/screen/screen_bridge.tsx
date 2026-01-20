import { FilterEngine, hasActiveFilter } from '@navios/commander-tui'
import { Box, Text } from 'ink'
import { useMemo } from 'react'

import type { ScreenInstance, MessageData } from '@navios/commander-tui'

import { useTheme, useScreenMessages, useActivePrompt } from '../../hooks/index.ts'
import { useFilter } from '../content/filter_context.tsx'
import { PromptRenderer } from '../prompt/index.ts'
import { ScrollBox } from '../scroll/index.ts'

import { GroupRenderer } from './group_renderer.tsx'
import { MessageRenderer } from './message_renderer.tsx'

export interface ScreenBridgeProps {
  screen: ScreenInstance
  focused: boolean
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
 * Uses useSyncExternalStore-based hooks for proper React 18 concurrent mode support.
 */
export function ScreenBridge({ screen, focused }: ScreenBridgeProps) {
  const theme = useTheme()
  const filter = useFilter()

  // Use new hooks that properly subscribe to screen events
  const allMessages = useScreenMessages(screen)
  const activePrompt = useActivePrompt(screen)

  // Filter messages based on current filter state
  const filteredMessages = useMemo(() => {
    return FilterEngine.filterMessages(allMessages, filter)
  }, [allMessages, filter])

  const isFiltering = useMemo(() => hasActiveFilter(filter), [filter])

  const processedMessages = useMemo(
    () => processMessagesIntoGroups(filteredMessages),
    [filteredMessages],
  )

  // Calculate filter stats
  const totalMessages = allMessages.length
  const filteredCount = filteredMessages.length
  const showFilterStatus = isFiltering && filteredCount !== totalMessages

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
            {filteredCount}/{totalMessages} messages
          </Text>
        )}
      </Box>

      {/* Scrollable content area - each message is a direct child for measurement */}
      <ScrollBox
        flexGrow={1}
        scrollY
        stickyScroll
        mouseScroll
        scrollbarTrackColor={theme.sidebar.textDim}
        scrollbarThumbColor={theme.sidebar.text}
      >
        {processedMessages.map((item, index) => {
          const key = `item-${index}`
          if (item.type === 'group') {
            return (
              <Box key={key} marginBottom={1} paddingLeft={1} paddingRight={1}>
                <GroupRenderer label={item.label!} messages={item.messages!} screen={screen} />
              </Box>
            )
          } else {
            return (
              <Box key={key} marginBottom={1} paddingLeft={1} paddingRight={1}>
                <MessageRenderer message={item.message!} screen={screen} />
              </Box>
            )
          }
        })}

        {/* Render active prompt at the end of messages */}
        {activePrompt && (
          <Box paddingLeft={1} paddingRight={1}>
            <PromptRenderer prompt={activePrompt} />
          </Box>
        )}
      </ScrollBox>
    </Box>
  )
}
