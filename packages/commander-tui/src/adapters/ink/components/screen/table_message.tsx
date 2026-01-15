import { Box, Text } from 'ink'

import { TABLE_COLORS } from '../../../../utils/index.ts'

import type { TableMessageData } from '../../../../types/index.ts'

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
    <Box flexDirection="row">
      {/* Left border indicator */}
      <Text color={TABLE_COLORS.border}>│</Text>

      {/* Content area */}
      <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
        {message.title && (
          <Text color={TABLE_COLORS.title} bold>
            {message.title}
          </Text>
        )}
        <Text color={TABLE_COLORS.headerText} bold>
          {headerRow}
        </Text>
        <Text color={TABLE_COLORS.separator}>{separator}</Text>
        {dataRows.map((row, i) => (
          <Text key={i} color={TABLE_COLORS.cellText}>
            {row}
          </Text>
        ))}
      </Box>
    </Box>
  )
}
