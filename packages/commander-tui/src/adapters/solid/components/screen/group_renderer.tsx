import { TextAttributes } from '@opentui/core'
import { For, Show } from 'solid-js'

import { useTheme } from '../../hooks/index.ts'

import type { MessageData, GroupMessageData } from '../../../../types/index.ts'

import { MessageRenderer } from './message_renderer.tsx'

export interface GroupRendererProps {
  label: string
  messages: MessageData[]
}

export function GroupRenderer(props: GroupRendererProps) {
  const theme = useTheme()

  return (
    <box
      flexDirection="column"
      border={['left']}
      borderColor={theme.group.border}
      backgroundColor={theme.group.background}
      paddingLeft={1}
    >
      {/* Group header */}
      <box flexDirection="row" marginBottom={1}>
        <text fg={theme.group.icon}>▼ </text>
        <text fg={theme.group.headerText} attributes={TextAttributes.BOLD}>
          {props.label}
        </text>
      </box>

      {/* Group content */}
      <box flexDirection="column" gap={1}>
        <For each={props.messages}>{(msg) => <MessageRenderer message={msg} />}</For>
      </box>
    </box>
  )
}

export interface GroupMessageRendererProps {
  message: GroupMessageData
}

/**
 * Fallback renderer for group markers (when not processed at higher level)
 */
export function GroupMessageRenderer(props: GroupMessageRendererProps) {
  const theme = useTheme()

  return (
    <Show when={!props.message.isEnd}>
      <box flexDirection="row" borderColor={theme.group.border} border={['left']} paddingLeft={1}>
        <text fg={theme.group.headerText} attributes={TextAttributes.BOLD}>
          ▼ {props.message.label}
        </text>
      </box>
    </Show>
  )
}
