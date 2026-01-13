import { TextAttributes } from '@opentui/core'
import { createSignal, createEffect, createMemo, For, Show, onCleanup } from 'solid-js'

import { useTheme } from '../../hooks/index.ts'
import { PromptRenderer } from '../prompt/index.ts'

import type { ScreenInstance } from '../../../../services/index.ts'
import type { MessageData } from '../../../../types/index.ts'

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

export function ScreenBridge(props: ScreenBridgeProps) {
  const theme = useTheme()
  const [version, setVersion] = createSignal(0)

  // Subscribe to screen changes
  createEffect(() => {
    const unsub = props.screen.onChange(() => setVersion((v) => v + 1))
    onCleanup(() => unsub())
  })

  // Use filtered messages if provided, otherwise get from screen
  const messages = createMemo(() => {
    version() // Track version for reactivity
    return props.filteredMessages ?? props.screen.getMessages()
  })

  const activePrompt = createMemo(() => {
    version() // Track version for reactivity
    return props.screen.getActivePrompt()
  })

  const processedMessages = createMemo(() => processMessagesIntoGroups(messages()))

  // Calculate filter stats
  const filteredCount = () => messages().length
  const total = () => props.totalMessages ?? messages().length
  const showFilterStatus = () => props.isFiltering && filteredCount() !== total()

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
          {props.screen.getName()}
        </text>
        <Show when={showFilterStatus()}>
          <text fg={theme.sidebar.textDim}>
            {filteredCount()}/{total()} messages
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
