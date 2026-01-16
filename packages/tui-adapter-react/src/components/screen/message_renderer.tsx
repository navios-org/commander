import type {
  MessageData,
  LoadingMessageData,
  ProgressMessageData,
  GroupMessageData,
  TableMessageData,
} from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'
import { FileLog } from '../file/index.ts'
import { LogMessage } from '../log/index.ts'

import { GroupMessageRenderer } from './group_renderer.tsx'
import { LoadingMessage } from './loading_message.tsx'
import { ProgressMessage } from './progress_message.tsx'
import { TableMessage } from './table_message.tsx'

export interface MessageRendererProps {
  message: MessageData
}

export function MessageRenderer({ message }: MessageRendererProps) {
  const theme = useTheme()

  switch (message.type) {
    case 'log':
      return (
        <LogMessage
          level={message.level}
          timestamp={message.timestamp}
          variant={message.variant}
          label={message.label}
          trace={message.trace}
        >
          {message.content}
        </LogMessage>
      )

    case 'file':
      return (
        <box
          flexDirection="column"
          border={['left']}
          borderColor={theme.file.border}
          backgroundColor={theme.file.background}
        >
          <FileLog
            mode="full"
            filePath={message.filePath}
            content={message.content}
            headerBackgroundColor={theme.file.headerBackground}
          />
        </box>
      )

    case 'diff':
      return (
        <box
          flexDirection="column"
          border={['left']}
          borderColor={theme.file.border}
          backgroundColor={theme.file.background}
        >
          <FileLog
            mode="diff"
            filePath={message.filePath}
            diff={message.diff}
            view={message.view}
            headerBackgroundColor={theme.file.headerBackground}
          />
        </box>
      )

    case 'fileError':
      return (
        <box
          flexDirection="column"
          border={['left']}
          borderColor={theme.file.border}
          backgroundColor={theme.file.background}
        >
          <FileLog
            mode="partial"
            filePath={message.filePath}
            content={message.content}
            startLine={message.startLine}
            errorLines={message.errorLines}
            headerBackgroundColor={theme.file.headerBackground}
          />
        </box>
      )

    case 'loading':
      return <LoadingMessage message={message as LoadingMessageData} />

    case 'progress':
      return <ProgressMessage message={message as ProgressMessageData} />

    case 'group':
      return <GroupMessageRenderer message={message as GroupMessageData} />

    case 'table':
      return <TableMessage message={message as TableMessageData} />

    default:
      return null
  }
}
