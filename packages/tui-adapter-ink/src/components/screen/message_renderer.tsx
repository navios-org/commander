import { Box, Text } from 'ink'

import type {
  MessageData,
  LoadingMessageData,
  ProgressMessageData,
  GroupMessageData,
  TableMessageData,
  ScreenInstance,
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
  screen: ScreenInstance
}

export function MessageRenderer({ message, screen }: MessageRendererProps) {
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
        <Box flexDirection="row">
          <Text color={theme.file.border}>│</Text>
          <Box flexDirection="column" paddingLeft={1}>
            <FileLog
              mode="full"
              filePath={message.filePath}
              content={message.content}
              headerBackgroundColor={theme.file.headerBackground}
            />
          </Box>
        </Box>
      )

    case 'diff':
      return (
        <Box flexDirection="row">
          <Text color={theme.file.border}>│</Text>
          <Box flexDirection="column" paddingLeft={1}>
            <FileLog
              mode="diff"
              filePath={message.filePath}
              diff={message.diff}
              view={message.view}
              headerBackgroundColor={theme.file.headerBackground}
            />
          </Box>
        </Box>
      )

    case 'fileError':
      return (
        <Box flexDirection="row">
          <Text color={theme.file.border}>│</Text>
          <Box flexDirection="column" paddingLeft={1}>
            <FileLog
              mode="partial"
              filePath={message.filePath}
              content={message.content}
              startLine={message.startLine}
              errorLines={message.errorLines}
              headerBackgroundColor={theme.file.headerBackground}
            />
          </Box>
        </Box>
      )

    case 'loading':
      return <LoadingMessage message={message as LoadingMessageData} screen={screen} />

    case 'progress':
      return <ProgressMessage message={message as ProgressMessageData} screen={screen} />

    case 'group':
      return <GroupMessageRenderer message={message as GroupMessageData} />

    case 'table':
      return <TableMessage message={message as TableMessageData} />

    default:
      return null
  }
}
