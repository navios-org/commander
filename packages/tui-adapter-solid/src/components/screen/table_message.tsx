import { TABLE_COLORS } from '@navios/commander-tui'
import { TextAttributes } from '@opentui/core'
import { For, Show, createMemo } from 'solid-js'

import type { TableMessageData } from '@navios/commander-tui'

export interface TableMessageProps {
  message: TableMessageData
}

export function TableMessage(props: TableMessageProps) {
  // Calculate column widths
  const colWidths = createMemo(() =>
    props.message.headers.map((h, i) => {
      const headerLen = h.length
      const maxRowLen =
        props.message.rows.length > 0
          ? Math.max(...props.message.rows.map((r) => (r[i] ?? '').length))
          : 0
      return Math.max(headerLen, maxRowLen)
    }),
  )

  const pad = (str: string, width: number) => str.padEnd(width)

  const headerRow = createMemo(() =>
    props.message.headers.map((h, i) => pad(h, colWidths()[i] ?? 0)).join(' │ '),
  )

  const separator = createMemo(() =>
    colWidths()
      .map((w) => '─'.repeat(w))
      .join('─┼─'),
  )

  const dataRows = createMemo(() =>
    props.message.rows.map((row) =>
      row.map((cell, i) => pad(cell, colWidths()[i] ?? 0)).join(' │ '),
    ),
  )

  return (
    <box
      flexDirection="column"
      border={['left']}
      borderColor={TABLE_COLORS.border}
      backgroundColor={TABLE_COLORS.background}
      paddingLeft={1}
      paddingRight={1}
    >
      <Show when={props.message.title}>
        <text fg={TABLE_COLORS.title} attributes={TextAttributes.BOLD}>
          {props.message.title}
        </text>
      </Show>
      <text fg={TABLE_COLORS.headerText} attributes={TextAttributes.BOLD}>
        {headerRow()}
      </text>
      <text fg={TABLE_COLORS.separator}>{separator()}</text>
      <For each={dataRows()}>{(row) => <text fg={TABLE_COLORS.cellText}>{row}</text>}</For>
    </box>
  )
}
