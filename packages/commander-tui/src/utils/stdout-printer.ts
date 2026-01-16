import type { LogLevel } from '@navios/core'

import type {
  GroupMessageData,
  LoadingMessageData,
  LogMessageData,
  LogMessageVariant,
  MessageData,
  ProgressMessageData,
  TableMessageData,
} from '../types/index.ts'

import {
  DEFAULT_LOG_LEVEL_COLORS,
  GROUP_COLORS,
  PROGRESS_COLORS,
  TABLE_COLORS,
  VARIANT_COLORS,
} from './colors/index.ts'

// ANSI escape codes
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'

// Convert hex color to ANSI 24-bit color
function hexToAnsi(hex: string, isForeground = true): string {
  // Remove # if present and take first 6 chars
  const cleanHex = hex.replace('#', '').slice(0, 6)

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return '' // Return empty string for invalid colors (no styling)
  }

  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)

  const code = isForeground ? 38 : 48
  return `\x1b[${code};2;${r};${g};${b}m`
}

// Get ANSI color for log level or variant
function getLogLevelAnsiColor(level: LogLevel, variant?: LogMessageVariant): string {
  const colors = variant ? VARIANT_COLORS[variant] : DEFAULT_LOG_LEVEL_COLORS[level]
  return hexToAnsi(colors.border, true)
}

// Format a log level label
function formatLevel(level: LogLevel, variant?: LogMessageVariant): string {
  const color = getLogLevelAnsiColor(level, variant)
  // Use variant name if present, otherwise use level name
  const displayName = variant ?? level
  const label = displayName.toUpperCase().padEnd(7)
  return `${color}${BOLD}[${label}]${RESET}`
}

// Format timestamp
function formatTimestamp(date: Date): string {
  return `${DIM}${date.toLocaleTimeString()}${RESET}`
}

// Print a single message
function printMessage(message: MessageData, stream: NodeJS.WriteStream): void {
  switch (message.type) {
    case 'log': {
      const logMessage = message as LogMessageData
      const timestamp = formatTimestamp(message.timestamp)
      const level = formatLevel(logMessage.level, logMessage.variant)
      const label = logMessage.label ? ` ${DIM}[${logMessage.label}]${RESET}` : ''
      stream.write(`${timestamp} ${level}${label} ${logMessage.content}\n`)
      break
    }

    case 'file': {
      const header = `${DIM}─── ${message.filePath} ───${RESET}`
      stream.write(`${header}\n${message.content}\n`)
      break
    }

    case 'diff': {
      const header = `${DIM}─── ${message.filePath} (diff) ───${RESET}`
      // Color diff lines
      const coloredDiff = message.diff
        .split('\n')
        .map((line) => {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            return `\x1b[32m${line}${RESET}` // Green for additions
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            return `\x1b[31m${line}${RESET}` // Red for deletions
          } else if (line.startsWith('@@')) {
            return `\x1b[36m${line}${RESET}` // Cyan for hunk headers
          }
          return line
        })
        .join('\n')
      stream.write(`${header}\n${coloredDiff}\n`)
      break
    }

    case 'fileError': {
      const header = `${DIM}─── ${message.filePath} ───${RESET}`
      const errorLineSet = new Set(message.errorLines)
      const startLine = message.startLine ?? 1

      const lines = message.content.split('\n')
      const numberedLines = lines.map((line, index) => {
        const lineNum = startLine + index
        const numStr = String(lineNum).padStart(4)
        const isError = errorLineSet.has(lineNum)

        if (isError) {
          return `\x1b[31m${numStr} │ ${line}${RESET}`
        }
        return `${DIM}${numStr}${RESET} │ ${line}`
      })

      stream.write(`${header}\n${numberedLines.join('\n')}\n`)
      break
    }

    case 'loading': {
      const loadingMessage = message as LoadingMessageData
      const status = loadingMessage.status
      const content = loadingMessage.resolvedContent ?? loadingMessage.content

      let level: LogLevel = 'log'
      let variant: LogMessageVariant | undefined
      if (status === 'success') {
        level = 'log'
        variant = 'success'
      } else if (status === 'fail') {
        level = 'error'
      }

      const timestamp = formatTimestamp(message.timestamp)
      const levelStr = formatLevel(level, variant)
      const prefix = status === 'loading' ? '... ' : ''
      stream.write(`${timestamp} ${levelStr} ${prefix}${content}\n`)
      break
    }

    case 'progress': {
      const progressMessage = message as ProgressMessageData
      const { label, current, total, status, resolvedContent } = progressMessage
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0
      const barWidth = 20
      const filledWidth = Math.round((percentage / 100) * barWidth)
      const emptyWidth = barWidth - filledWidth

      const progressColor = hexToAnsi(PROGRESS_COLORS.barFilled)
      const emptyColor = hexToAnsi(PROGRESS_COLORS.barEmpty)
      const filledBar = '█'.repeat(filledWidth)
      const emptyBar = '░'.repeat(emptyWidth)

      let statusIcon = ''
      let statusColor = ''
      if (status === 'complete') {
        statusIcon = '✓'
        statusColor = hexToAnsi(PROGRESS_COLORS.complete)
      } else if (status === 'failed') {
        statusIcon = '✗'
        statusColor = hexToAnsi(PROGRESS_COLORS.failed)
      }

      const displayLabel = resolvedContent ?? label
      const progressBar = `${progressColor}${filledBar}${RESET}${emptyColor}${emptyBar}${RESET}`
      const percentStr = `${String(percentage).padStart(3)}%`

      if (statusIcon) {
        stream.write(
          `${statusColor}${statusIcon}${RESET} ${displayLabel} [${progressBar}] ${percentStr}\n`,
        )
      } else {
        stream.write(`  ${displayLabel} [${progressBar}] ${percentStr} (${current}/${total})\n`)
      }
      break
    }

    case 'group': {
      const groupMessage = message as GroupMessageData
      const { label, collapsed, isEnd } = groupMessage
      const groupColor = hexToAnsi(GROUP_COLORS.border)
      const iconColor = hexToAnsi(GROUP_COLORS.icon)

      if (isEnd) {
        stream.write(`${groupColor}└─${RESET} ${DIM}end ${label}${RESET}\n`)
      } else {
        const icon = collapsed ? '▶' : '▼'
        stream.write(
          `${groupColor}┌─${RESET} ${iconColor}${icon}${RESET} ${BOLD}${label}${RESET}\n`,
        )
      }
      break
    }

    case 'table': {
      const tableMessage = message as TableMessageData
      const { headers, rows, title } = tableMessage

      const tableColor = hexToAnsi(TABLE_COLORS.border)
      const headerColor = hexToAnsi(TABLE_COLORS.headerText)
      const cellColor = hexToAnsi(TABLE_COLORS.cellText)

      // Calculate column widths
      const colWidths = headers.map((h, i) => {
        const maxRowWidth = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0)
        return Math.max(h.length, maxRowWidth)
      })

      // Build separator line
      const separator = `${tableColor}├${colWidths.map((w) => '─'.repeat(w + 2)).join('┼')}┤${RESET}`
      const topBorder = `${tableColor}┌${colWidths.map((w) => '─'.repeat(w + 2)).join('┬')}┐${RESET}`
      const bottomBorder = `${tableColor}└${colWidths.map((w) => '─'.repeat(w + 2)).join('┴')}┘${RESET}`

      // Print title if present
      if (title) {
        stream.write(`${BOLD}${title}${RESET}\n`)
      }

      // Print top border
      stream.write(`${topBorder}\n`)

      // Print headers
      const headerRow = headers
        .map((h, i) => ` ${h.padEnd(colWidths[i])} `)
        .join(`${tableColor}│${RESET}`)
      stream.write(
        `${tableColor}│${RESET}${headerColor}${headerRow}${RESET}${tableColor}│${RESET}\n`,
      )

      // Print separator
      stream.write(`${separator}\n`)

      // Print rows
      for (const row of rows) {
        const rowStr = headers
          .map((_, i) => ` ${(row[i] ?? '').padEnd(colWidths[i])} `)
          .join(`${tableColor}│${RESET}`)
        stream.write(`${tableColor}│${RESET}${cellColor}${rowStr}${RESET}${tableColor}│${RESET}\n`)
      }

      // Print bottom border
      stream.write(`${bottomBorder}\n`)
      break
    }
  }
}

/**
 * Print a single message to stdout with optional screen name prefix.
 * Used for immediate output in stdout mode (when OpenTUI is not active).
 */
export function printSingleMessage(
  message: MessageData,
  screenName?: string,
  isError: boolean = false,
): void {
  const stream = isError ? process.stderr : process.stdout

  // Add screen name prefix for context (dimmed)
  if (screenName) {
    stream.write(`${DIM}[${screenName}]${RESET} `)
  }

  printMessage(message, stream)
}

/**
 * Print all messages to stdout (or stderr if isError)
 */
export function printMessagesToStdout(
  messages: MessageData[],
  screenName: string,
  isError: boolean = false,
): void {
  const stream = isError ? process.stderr : process.stdout

  // Print screen header
  const headerColor = isError ? '\x1b[31m' : '\x1b[32m'
  const status = isError ? 'FAILED' : 'COMPLETED'
  stream.write(`\n${headerColor}${BOLD}═══ ${screenName} [${status}] ═══${RESET}\n\n`)

  // Print each message
  for (const message of messages) {
    printMessage(message, stream)
  }

  stream.write('\n')
}
