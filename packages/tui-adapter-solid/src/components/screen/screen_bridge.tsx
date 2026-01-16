import { FilterEngine, hasActiveFilter, SCREEN_EVENTS } from '@navios/commander-tui'
import { TextAttributes } from '@opentui/core'
import { createSignal, createMemo, createEffect, onCleanup, For, Show, untrack } from 'solid-js'

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
export function ScreenBridge(props: ScreenBridgeProps) {
  const theme = useTheme()
  const filter = useFilter()
  const [messageVersion, setMessageVersion] = createSignal(0)

  // Capture screen reference once to avoid reactive dependency on props
  const screen = untrack(() => props.screen)

  // Subscribe to screen events to trigger re-render when messages change
  // Wrap in createEffect to ensure proper cleanup on re-runs
  createEffect(() => {
    const handleUpdate = () => setMessageVersion((v) => v + 1)

    for (const event of SCREEN_EVENTS) {
      screen.on(event, handleUpdate)
    }

    onCleanup(() => {
      for (const event of SCREEN_EVENTS) {
        screen.off(event, handleUpdate)
      }
    })
  })

  // Get all messages from screen
  const allMessages = () => {
    messageVersion() // Track dependency for reactivity
    return screen.getMessages()
  }

  // Filter messages based on current filter state
  const filteredMessages = createMemo(() => {
    return FilterEngine.filterMessages(allMessages(), filter())
  })

  const isFiltering = createMemo(() => hasActiveFilter(filter()))

  const activePrompt = () => {
    messageVersion() // Track dependency for prompt updates
    return screen.getActivePrompt()
  }

  // Cache screen name to avoid reactive prop access in template
  const screenName = screen.getName()

  const processedMessages = createMemo(() => processMessagesIntoGroups(filteredMessages()))

  // Calculate filter stats
  const totalMessages = () => allMessages().length
  const filteredCount = () => filteredMessages().length
  const showFilterStatus = () => isFiltering() && filteredCount() !== totalMessages()

  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Screen header */}
      <box
        backgroundColor={theme.header.background}
        borderColor={props.focused ? theme.sidebar.focusBorder : theme.header.border}
        border={['bottom']}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        justifyContent="space-between"
      >
        <text fg={theme.header.text} attributes={TextAttributes.BOLD}>
          {screenName}
        </text>
        <Show when={showFilterStatus()}>
          <text fg={theme.sidebar.textDim}>
            {filteredCount()}/{totalMessages()} messages
          </text>
        </Show>
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
        <For each={processedMessages()}>
          {(item) => (
            <Show
              when={item.type === 'group'}
              fallback={<MessageRenderer message={item.message!} />}
            >
              <GroupRenderer label={item.label!} messages={item.messages!} />
            </Show>
          )}
        </For>

        {/* Render active prompt at the end of messages */}
        <Show when={activePrompt()}>
          <PromptRenderer prompt={activePrompt()!} />
        </Show>
      </scrollbox>
    </box>
  )
}
