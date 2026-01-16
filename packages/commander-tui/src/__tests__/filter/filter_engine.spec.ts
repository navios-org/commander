import { beforeEach, describe, expect, it } from 'vitest'

import type { LogLevel } from '@navios/core'

import { FilterEngine } from '../../filter/filter_engine.ts'
import {
  createDiffMessage,
  createFilterState,
  createGroupMessage,
  createLoadingMessage,
  createLogMessage,
  createProgressMessage,
  createTableMessage,
  createFileMessage,
  resetIdCounter,
} from '../utils/factories.ts'

import type { MessageData } from '../../types/index.ts'

describe('FilterEngine', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('filterMessages', () => {
    it('should return original array when no filters are active', () => {
      const messages: MessageData[] = [
        createLogMessage({ level: 'log' }),
        createLogMessage({ level: 'error' }),
        createLogMessage({ level: 'warn' }),
      ]

      const filter = createFilterState()
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toBe(messages) // Same reference
    })

    it('should filter by single log level', () => {
      const messages: MessageData[] = [
        createLogMessage({ level: 'log', content: 'log message' }),
        createLogMessage({ level: 'error', content: 'error message' }),
        createLogMessage({ level: 'warn', content: 'warn message' }),
      ]

      const filter = createFilterState({
        enabledLevels: new Set(['error'] as LogLevel[]),
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(1)
      expect((result[0] as any).level).toBe('error')
    })

    it('should filter by multiple log levels', () => {
      const messages: MessageData[] = [
        createLogMessage({ level: 'log' }),
        createLogMessage({ level: 'error' }),
        createLogMessage({ level: 'warn' }),
        createLogMessage({ level: 'debug' }),
      ]

      const filter = createFilterState({
        enabledLevels: new Set(['error', 'warn'] as LogLevel[]),
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(2)
      expect(result.map((m) => (m as any).level)).toEqual(['error', 'warn'])
    })

    it('should filter by search query (content match)', () => {
      const messages: MessageData[] = [
        createLogMessage({ content: 'Hello world' }),
        createLogMessage({ content: 'Goodbye world' }),
        createLogMessage({ content: 'Something else' }),
      ]

      const filter = createFilterState({
        searchQuery: 'world',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(2)
    })

    it('should filter by search query (label match)', () => {
      const messages: MessageData[] = [
        createLogMessage({ content: 'Message 1', label: 'API' }),
        createLogMessage({ content: 'Message 2', label: 'Database' }),
        createLogMessage({ content: 'Message 3', label: 'API' }),
      ]

      const filter = createFilterState({
        searchQuery: 'API',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(2)
    })

    it('should combine log level and search filters', () => {
      const messages: MessageData[] = [
        createLogMessage({ level: 'log', content: 'Hello log' }),
        createLogMessage({ level: 'error', content: 'Hello error' }),
        createLogMessage({ level: 'log', content: 'Goodbye log' }),
        createLogMessage({ level: 'error', content: 'Goodbye error' }),
      ]

      const filter = createFilterState({
        enabledLevels: new Set(['error'] as LogLevel[]),
        searchQuery: 'Hello',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(1)
      expect((result[0] as any).content).toBe('Hello error')
    })

    it('should preserve group markers during filtering', () => {
      const messages: MessageData[] = [
        createGroupMessage({ label: 'Group 1', isEnd: false }),
        createLogMessage({ level: 'error', content: 'Error in group' }),
        createGroupMessage({ label: '', isEnd: true }),
      ]

      const filter = createFilterState({
        enabledLevels: new Set(['log'] as LogLevel[]), // Excludes error
      })
      const result = FilterEngine.filterMessages(messages, filter)

      // Group markers should still be present
      expect(result.filter((m) => m.type === 'group')).toHaveLength(2)
    })

    it('should handle non-log messages (file, progress, loading) without level filter', () => {
      const messages: MessageData[] = [
        createFileMessage({ filePath: '/test.ts' }),
        createProgressMessage({ label: 'Processing' }),
        createLoadingMessage({ content: 'Loading...' }),
        createLogMessage({ level: 'log', content: 'Log message' }),
      ]

      const filter = createFilterState({
        enabledLevels: new Set(['error'] as LogLevel[]), // Would exclude log
      })
      const result = FilterEngine.filterMessages(messages, filter)

      // Non-log messages should pass through
      expect(result.filter((m) => m.type === 'file')).toHaveLength(1)
      expect(result.filter((m) => m.type === 'progress')).toHaveLength(1)
      expect(result.filter((m) => m.type === 'loading')).toHaveLength(1)
      // Log message should be filtered out
      expect(result.filter((m) => m.type === 'log')).toHaveLength(0)
    })

    it('should perform case-insensitive search', () => {
      const messages: MessageData[] = [
        createLogMessage({ content: 'HELLO WORLD' }),
        createLogMessage({ content: 'hello world' }),
        createLogMessage({ content: 'Hello World' }),
      ]

      const filter = createFilterState({
        searchQuery: 'hello',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(3)
    })

    it('should search file message path and content', () => {
      const messages: MessageData[] = [
        createFileMessage({ filePath: '/src/api.ts', content: 'const x = 1' }),
        createFileMessage({ filePath: '/src/db.ts', content: 'const api = 2' }),
        createFileMessage({ filePath: '/src/utils.ts', content: 'const y = 3' }),
      ]

      const filter = createFilterState({
        searchQuery: 'api',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(2)
    })

    it('should search diff message path and diff content', () => {
      const messages: MessageData[] = [
        createDiffMessage({ filePath: '/src/api.ts', diff: '- old\n+ new' }),
        createDiffMessage({ filePath: '/src/db.ts', diff: '- removed\n+ added api call' }),
        createDiffMessage({ filePath: '/src/utils.ts', diff: '- x\n+ y' }),
      ]

      const filter = createFilterState({
        searchQuery: 'api',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(2)
    })

    it('should search loading message content and resolved content', () => {
      const messages: MessageData[] = [
        createLoadingMessage({ content: 'Loading data...', resolvedContent: 'Done!' }),
        createLoadingMessage({ content: 'Saving...', resolvedContent: 'Data saved!' }),
        createLoadingMessage({ content: 'Processing...', resolvedContent: undefined }),
      ]

      const filter = createFilterState({
        searchQuery: 'data',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(2)
    })

    it('should search progress message label', () => {
      const messages: MessageData[] = [
        createProgressMessage({ label: 'Downloading files' }),
        createProgressMessage({ label: 'Uploading data' }),
        createProgressMessage({ label: 'Processing' }),
      ]

      const filter = createFilterState({
        searchQuery: 'load',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(2) // Downloading and Uploading
    })

    it('should search group message label', () => {
      const messages: MessageData[] = [
        createGroupMessage({ label: 'API Calls', isEnd: false }),
        createGroupMessage({ label: 'Database Operations', isEnd: false }),
      ]

      const filter = createFilterState({
        searchQuery: 'API',
      })
      const result = FilterEngine.filterMessages(messages, filter)

      expect(result).toHaveLength(1)
    })

    it('should search table title, headers, and cell content', () => {
      const messages: MessageData[] = [
        createTableMessage({
          title: 'User Data',
          headers: ['Name', 'Email'],
          rows: [['John', 'john@example.com']],
        }),
        createTableMessage({
          title: 'Products',
          headers: ['SKU', 'Price'],
          rows: [['ABC123', '99.99']],
        }),
        createTableMessage({
          headers: ['ID', 'Value'],
          rows: [['1', 'test']],
        }),
      ]

      // Search by title
      let filter = createFilterState({ searchQuery: 'User' })
      expect(FilterEngine.filterMessages(messages, filter)).toHaveLength(1)

      // Search by header
      filter = createFilterState({ searchQuery: 'Email' })
      expect(FilterEngine.filterMessages(messages, filter)).toHaveLength(1)

      // Search by cell content
      filter = createFilterState({ searchQuery: 'john@' })
      expect(FilterEngine.filterMessages(messages, filter)).toHaveLength(1)
    })
  })

  describe('countByLevel', () => {
    it('should count messages by log level', () => {
      const messages: MessageData[] = [
        createLogMessage({ level: 'log' }),
        createLogMessage({ level: 'log' }),
        createLogMessage({ level: 'error' }),
        createLogMessage({ level: 'warn' }),
        createLogMessage({ level: 'warn' }),
        createLogMessage({ level: 'warn' }),
      ]

      const counts = FilterEngine.countByLevel(messages)

      expect(counts.log).toBe(2)
      expect(counts.error).toBe(1)
      expect(counts.warn).toBe(3)
      expect(counts.debug).toBe(0)
      expect(counts.verbose).toBe(0)
      expect(counts.fatal).toBe(0)
    })

    it('should ignore non-log messages', () => {
      const messages: MessageData[] = [
        createLogMessage({ level: 'log' }),
        createFileMessage(),
        createProgressMessage(),
        createLoadingMessage(),
        createGroupMessage(),
        createTableMessage(),
      ]

      const counts = FilterEngine.countByLevel(messages)

      expect(counts.log).toBe(1)
      expect(counts.error).toBe(0)
    })

    it('should return zero counts for empty array', () => {
      const counts = FilterEngine.countByLevel([])

      expect(counts.log).toBe(0)
      expect(counts.error).toBe(0)
      expect(counts.warn).toBe(0)
      expect(counts.debug).toBe(0)
      expect(counts.verbose).toBe(0)
      expect(counts.fatal).toBe(0)
    })
  })
})
