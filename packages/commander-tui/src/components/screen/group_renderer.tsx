import { TextAttributes } from '@opentui/core'

import { useTheme } from '../../hooks/index.ts'

import type { MessageData, GroupMessageData } from '../../types/index.ts'

import { MessageRenderer } from './message_renderer.tsx'

export interface GroupRendererProps {
  label: string
  messages: MessageData[]
}

export function GroupRenderer({ label, messages }: GroupRendererProps) {
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
          {label}
        </text>
      </box>

      {/* Group content */}
      <box flexDirection="column" gap={1}>
        {messages.map((msg) => (
          <MessageRenderer key={msg.id} message={msg} />
        ))}
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
export function GroupMessageRenderer({ message }: GroupMessageRendererProps) {
  const theme = useTheme()

  if (message.isEnd) {
    return null
  }

  return (
    <box flexDirection="row" borderColor={theme.group.border} border={['left']} paddingLeft={1}>
      <text fg={theme.group.headerText} attributes={TextAttributes.BOLD}>
        ▼ {message.label}
      </text>
    </box>
  )
}
