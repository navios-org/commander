import { ALL_LOG_LEVELS } from '../types/index.ts'

import type { FilterState, LevelCounts, LogMessageData, MessageData } from '../types/index.ts'

/**
 * Filter engine for filtering log messages.
 */
export class FilterEngine {
  /**
   * Apply filter to messages array.
   */
  static filterMessages(messages: MessageData[], filter: FilterState): MessageData[] {
    // If no filtering active, return original
    if (filter.searchQuery === '' && filter.enabledLevels.size === ALL_LOG_LEVELS.length) {
      return messages
    }

    return messages.filter((msg) => {
      // Always show non-log messages unless searching
      if (msg.type !== 'log') {
        // For search, check if any content matches
        if (filter.searchQuery) {
          return this.messageMatchesSearch(msg, filter.searchQuery)
        }
        // Group markers need special handling
        if (msg.type === 'group') {
          return true // Always show group markers
        }
        return true
      }

      // Log message filtering
      const logMsg = msg as LogMessageData

      // Check log level
      if (!filter.enabledLevels.has(logMsg.level)) {
        return false
      }

      // Check search query
      if (filter.searchQuery && !this.messageMatchesSearch(logMsg, filter.searchQuery)) {
        return false
      }

      return true
    })
  }

  /**
   * Check if a message matches the search query.
   */
  private static messageMatchesSearch(msg: MessageData, query: string): boolean {
    const lowerQuery = query.toLowerCase()

    switch (msg.type) {
      case 'log':
        return (
          msg.content.toLowerCase().includes(lowerQuery) ||
          (msg.label?.toLowerCase().includes(lowerQuery) ?? false)
        )
      case 'file':
      case 'fileError':
        return (
          msg.filePath.toLowerCase().includes(lowerQuery) ||
          msg.content.toLowerCase().includes(lowerQuery)
        )
      case 'diff':
        return (
          msg.filePath.toLowerCase().includes(lowerQuery) ||
          msg.diff.toLowerCase().includes(lowerQuery)
        )
      case 'loading':
        return (
          msg.content.toLowerCase().includes(lowerQuery) ||
          (msg.resolvedContent?.toLowerCase().includes(lowerQuery) ?? false)
        )
      case 'progress':
        return msg.label.toLowerCase().includes(lowerQuery)
      case 'group':
        return msg.label.toLowerCase().includes(lowerQuery)
      case 'table':
        return (
          (msg.title?.toLowerCase().includes(lowerQuery) ?? false) ||
          msg.headers.some((h) => h.toLowerCase().includes(lowerQuery)) ||
          msg.rows.some((row) => row.some((cell) => cell.toLowerCase().includes(lowerQuery)))
        )
      default:
        return false
    }
  }

  /**
   * Count messages by log level.
   */
  static countByLevel(messages: MessageData[]): LevelCounts {
    const counts: LevelCounts = {
      debug: 0,
      log: 0,
      verbose: 0,
      error: 0,
      fatal: 0,
      warn: 0,
    }

    for (const msg of messages) {
      if (msg.type === 'log') {
        counts[(msg as LogMessageData).level]++
      }
    }

    return counts
  }
}
