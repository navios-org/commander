import { TextAttributes } from '@opentui/core'

import { TABLE_COLORS } from '@navios/commander-tui'

import type { TableMessageData } from '@navios/commander-tui'

export interface TableMessageProps {
  message: TableMessageData
}

export function TableMessage({ message }: TableMessageProps) {
  // Calculate column widths
  const colWidths = message.headers.map((h, i) => {
    const headerLen = h.length
    const maxRowLen =
      message.rows.length > 0
        ? Math.max(...message.rows.map((r) => (r[i] ?? '').length))
        : 0
    return Math.max(headerLen, maxRowLen)
  })

  const pad = (str: string, width: number) => str.padEnd(width)

  const headerRow = message.headers.map((h, i) => pad(h, colWidths[i] ?? 0)).join(' │ ')

  const separator = colWidths.map((w) => '─'.repeat(w)).join('─┼─')

  const dataRows = message.rows.map((row) =>
    row.map((cell, i) => pad(cell, colWidths[i] ?? 0)).join(' │ '),
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
      {message.title && (
        <text fg={TABLE_COLORS.title} attributes={TextAttributes.BOLD}>
          {message.title}
        </text>
      )}
      <text fg={TABLE_COLORS.headerText} attributes={TextAttributes.BOLD}>
        {headerRow}
      </text>
      <text fg={TABLE_COLORS.separator}>{separator}</text>
      {dataRows.map((row, i) => (
        <text key={i} fg={TABLE_COLORS.cellText}>
          {row}
        </text>
      ))}
    </box>
  )
}
