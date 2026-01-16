import { Switch, Match } from 'solid-js'

import type {
  MessageData,
  LogMessageData,
  FileMessageData,
  DiffMessageData,
  FileErrorMessageData,
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

export function MessageRenderer(props: MessageRendererProps) {
  const theme = useTheme()
  const msg = () => props.message

  return (
    <Switch fallback={null}>
      <Match when={msg().type === 'log' && (msg() as LogMessageData)}>
        {(logMsg) => (
          <LogMessage
            level={logMsg().level}
            timestamp={logMsg().timestamp}
            variant={logMsg().variant}
            label={logMsg().label}
            trace={logMsg().trace}
          >
            {logMsg().content}
          </LogMessage>
        )}
      </Match>

      <Match when={msg().type === 'file' && (msg() as FileMessageData)}>
        {(fileMsg) => (
          <box
            flexDirection="column"
            border={['left']}
            borderColor={theme.file.border}
            backgroundColor={theme.file.background}
          >
            <FileLog
              mode="full"
              filePath={fileMsg().filePath}
              content={fileMsg().content}
              headerBackgroundColor={theme.file.headerBackground}
            />
          </box>
        )}
      </Match>

      <Match when={msg().type === 'diff' && (msg() as DiffMessageData)}>
        {(diffMsg) => (
          <box
            flexDirection="column"
            border={['left']}
            borderColor={theme.file.border}
            backgroundColor={theme.file.background}
          >
            <FileLog
              mode="diff"
              filePath={diffMsg().filePath}
              diff={diffMsg().diff}
              view={diffMsg().view}
              headerBackgroundColor={theme.file.headerBackground}
            />
          </box>
        )}
      </Match>

      <Match when={msg().type === 'fileError' && (msg() as FileErrorMessageData)}>
        {(errorMsg) => (
          <box
            flexDirection="column"
            border={['left']}
            borderColor={theme.file.border}
            backgroundColor={theme.file.background}
          >
            <FileLog
              mode="partial"
              filePath={errorMsg().filePath}
              content={errorMsg().content}
              startLine={errorMsg().startLine}
              errorLines={errorMsg().errorLines}
              headerBackgroundColor={theme.file.headerBackground}
            />
          </box>
        )}
      </Match>

      <Match when={msg().type === 'loading' && (msg() as LoadingMessageData)}>
        {(loadingMsg) => <LoadingMessage message={loadingMsg()} />}
      </Match>

      <Match when={msg().type === 'progress' && (msg() as ProgressMessageData)}>
        {(progressMsg) => <ProgressMessage message={progressMsg()} />}
      </Match>

      <Match when={msg().type === 'group' && (msg() as GroupMessageData)}>
        {(groupMsg) => <GroupMessageRenderer message={groupMsg()} />}
      </Match>

      <Match when={msg().type === 'table' && (msg() as TableMessageData)}>
        {(tableMsg) => <TableMessage message={tableMsg()} />}
      </Match>
    </Switch>
  )
}
