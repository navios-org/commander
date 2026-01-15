import { TextAttributes } from '@opentui/core'
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
    <box flexDirection="column" flexGrow={1}>
      {/* Screen header */}
      <box
        backgroundColor={theme.header.background}
        borderColor={focused ? theme.sidebar.focusBorder : theme.header.border}
        border={['bottom']}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        justifyContent="space-between"
      >
        <text fg={theme.header.text} attributes={TextAttributes.BOLD}>
          {screen.getName()}
        </text>
        {showFilterStatus && (
          <text fg={theme.sidebar.textDim}>
            {filteredCount}/{total} messages
          </text>
        )}
      </box>

      {/* Scrollable content area */}
      <scrollbox
        flexGrow={1}
        scrollY
        stickyScroll
        stickyStart="bottom"
        contentOptions={{
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 1,
          paddingBottom: 1,
          gap: 1,
        }}
      >
        {processedMessages.map((item, index) => {
          if (item.type === 'group') {
            return (
              <GroupRenderer key={`group-${index}`} label={item.label!} messages={item.messages!} />
            )
          } else {
            return <MessageRenderer key={item.message!.id} message={item.message!} />
          }
        })}

        {/* Render active prompt at the end of messages */}
        {activePrompt && <PromptRenderer prompt={activePrompt} />}
      </scrollbox>
    </box>
  )
}
