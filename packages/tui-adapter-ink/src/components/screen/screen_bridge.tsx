import { FilterEngine, hasActiveFilter, SCREEN_EVENTS } from '@navios/commander-tui'
import { Box, Text } from 'ink'
import { useState, useEffect, useMemo } from 'react'

import type { ScreenInstance, MessageData } from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'
import { useFilter } from '../content/filter_context.tsx'
import { PromptRenderer } from '../prompt/index.ts'

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
 * Subscribes to screen events and handles message filtering internally.
 */
export function ScreenBridge({ screen, focused }: ScreenBridgeProps) {
  const theme = useTheme()
  const filter = useFilter()
  const [messageVersion, setMessageVersion] = useState(0)

  // Subscribe to screen events to trigger re-render when messages change
  useEffect(() => {
    const handleUpdate = () => setMessageVersion((v) => v + 1)

    for (const event of SCREEN_EVENTS) {
      screen.on(event, handleUpdate)
    }

    return () => {
      for (const event of SCREEN_EVENTS) {
        screen.off(event, handleUpdate)
      }
    }
  }, [screen])

  // Get all messages from screen
  const allMessages = useMemo(() => {
    void messageVersion // Track dependency for re-render
    return screen.getMessages()
  }, [messageVersion, screen])

  // Filter messages based on current filter state
  const filteredMessages = useMemo(() => {
    return FilterEngine.filterMessages(allMessages, filter)
  }, [allMessages, filter])

  const isFiltering = useMemo(() => hasActiveFilter(filter), [filter])

  const activePrompt = useMemo(() => {
    void messageVersion // Track dependency for re-render
    return screen.getActivePrompt()
  }, [messageVersion, screen])

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
