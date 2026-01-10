import { inject, Injectable } from '@navios/core'

import type { LoggerService, LogLevel } from '@navios/core'

import { Screen, ScreenLogger } from '../tokens/index.ts'
import { captureTrace, formatObject } from '../utils/index.ts'

import type { LoggerOptions } from '../schemas/index.ts'
import type {
  DiffMessageData,
  FileErrorMessageData,
  FileMessageData,
  GroupMessageData,
  LoadingHandle,
  LoadingMessageData,
  LogMessageData,
  LogMessageVariant,
  ProgressHandle,
  ProgressMessageData,
  PromiseOptions,
  TableMessageData,
} from '../types/index.ts'

import type { ScreenInstance } from './screen.ts'

let messageIdCounter = 0
function generateId(): string {
  return `msg-${++messageIdCounter}`
}

@Injectable({
  token: ScreenLogger,
})
export class ScreenLoggerInstance implements LoggerService {
  private screen: ScreenInstance
  private context?: string
  private enabledLevels: Set<LogLevel>

  constructor(options: LoggerOptions) {
    this.screen = inject(
      Screen,
      typeof options.screen === 'string'
        ? {
            name: options.screen,
          }
        : options.screen,
    )

    this.context = options.context
    this.enabledLevels = new Set(options.enabledLevels)
  }

  private isLevelEnabled(level: LogLevel): boolean {
    return this.enabledLevels.has(level)
  }

  // ============================================
  // Log Level Methods (chainable)
  // ============================================

  verbose(msg: string | object, label?: string): this {
    return this.write('verbose', msg, label)
  }

  setLogLevels(levels: LogLevel[]) {
    this.enabledLevels = new Set(levels)
    return this
  }

  trace(msg: string | object, label?: string): this {
    const trace = captureTrace()
    return this.write('verbose', msg, label, trace, 'trace')
  }

  debug(msg: string | object, label?: string): this {
    return this.write('debug', msg, label)
  }

  log(msg: string | object, label?: string): this {
    return this.write('log', msg, label)
  }

  success(msg: string | object, label?: string): this {
    return this.write('log', msg, label, undefined, 'success')
  }

  warn(msg: string | object, label?: string): this {
    return this.write('warn', msg, label)
  }

  error(msg: string | object, label?: string): this {
    return this.write('error', msg, label)
  }

  fatal(msg: string | object, label?: string): this {
    return this.write('fatal', msg, label)
  }

  private write(
    level: LogLevel,
    content: string | object,
    label?: string,
    trace?: string,
    variant?: LogMessageVariant,
  ): this {
    if (!this.isLevelEnabled(level)) {
      return this
    }

    const formattedContent = typeof content === 'object' ? formatObject(content) : content
    const message: LogMessageData = {
      id: generateId(),
      type: 'log',
      timestamp: new Date(),
      level,
      content: formattedContent,
      label: label ?? this.context,
      trace,
      variant,
    }
    this.screen.addMessage(message)
    return this
  }

  // ============================================
  // File Methods (chainable)
  // ============================================

  file(path: string, content: string): this {
    if (!this.isLevelEnabled('debug')) {
      return this
    }

    const message: FileMessageData = {
      id: generateId(),
      type: 'file',
      timestamp: new Date(),
      filePath: path,
      content,
    }
    this.screen.addMessage(message)
    return this
  }

  diff(path: string, diffContent: string, view?: 'unified' | 'split'): this {
    if (!this.isLevelEnabled('debug')) {
      return this
    }

    const message: DiffMessageData = {
      id: generateId(),
      type: 'diff',
      timestamp: new Date(),
      filePath: path,
      diff: diffContent,
      view,
    }
    this.screen.addMessage(message)
    return this
  }

  fileError(path: string, content: string, errorLines: number[], startLine: number = 1): this {
    if (!this.isLevelEnabled('debug')) {
      return this
    }

    const message: FileErrorMessageData = {
      id: generateId(),
      type: 'fileError',
      timestamp: new Date(),
      filePath: path,
      content,
      errorLines,
      startLine,
    }
    this.screen.addMessage(message)
    return this
  }

  // ============================================
  // Promise/Async Methods
  // ============================================

  /**
   * Sonner-like promise handling
   */
  async promise<T>(promise: Promise<T>, options: PromiseOptions<T>): Promise<T> {
    const id = generateId()

    // Add loading message
    const loadingMessage: LoadingMessageData = {
      id,
      type: 'loading',
      timestamp: new Date(),
      content: options.loading,
      status: 'loading',
    }
    this.screen.addMessage(loadingMessage)

    try {
      const result = await promise

      // Update to success
      const successContent =
        typeof options.success === 'function' ? options.success(result) : options.success

      this.screen.updateMessage(id, {
        status: 'success',
        resolvedContent: successContent,
      })

      return result
    } catch (err) {
      // Update to error
      const error = err instanceof Error ? err : new Error(String(err))
      const errorContent =
        typeof options.error === 'function' ? options.error(error) : options.error

      this.screen.updateMessage(id, {
        status: 'fail',
        resolvedContent: errorContent,
      })

      throw err
    }
  }

  /**
   * Create a loading message with manual resolution
   */
  loading(message: string): LoadingHandle {
    const id = generateId()

    const loadingMessage: LoadingMessageData = {
      id,
      type: 'loading',
      timestamp: new Date(),
      content: message,
      status: 'loading',
    }
    this.screen.addMessage(loadingMessage)

    return {
      success: (resolvedMessage: string) => {
        this.screen.updateMessage(id, {
          status: 'success',
          resolvedContent: resolvedMessage,
        })
      },
      fail: (resolvedMessage: string) => {
        this.screen.updateMessage(id, {
          status: 'fail',
          resolvedContent: resolvedMessage,
        })
      },
    }
  }

  // ============================================
  // Progress Bar
  // ============================================

  /**
   * Create a progress bar with manual updates
   */
  progress(label: string, options: { total: number }): ProgressHandle {
    const id = generateId()

    const progressMessage: ProgressMessageData = {
      id,
      type: 'progress',
      timestamp: new Date(),
      label,
      current: 0,
      total: options.total,
      status: 'active',
    }
    this.screen.addMessage(progressMessage)

    return {
      update: (current: number, newLabel?: string) => {
        this.screen.updateProgressMessage(id, {
          current,
          label: newLabel ?? label,
        })
      },
      complete: (message?: string) => {
        this.screen.updateProgressMessage(id, {
          current: options.total,
          status: 'complete',
          resolvedContent: message,
        })
      },
      fail: (message?: string) => {
        this.screen.updateProgressMessage(id, {
          status: 'failed',
          resolvedContent: message,
        })
      },
    }
  }

  // ============================================
  // Log Groups
  // ============================================

  /**
   * Start a collapsible log group
   */
  group(label: string): this {
    const message: GroupMessageData = {
      id: generateId(),
      type: 'group',
      timestamp: new Date(),
      label,
      collapsed: false,
      isEnd: false,
    }
    this.screen.addMessage(message)
    return this
  }

  /**
   * End the current log group
   */
  groupEnd(): this {
    const message: GroupMessageData = {
      id: generateId(),
      type: 'group',
      timestamp: new Date(),
      label: '',
      collapsed: false,
      isEnd: true,
    }
    this.screen.addMessage(message)
    return this
  }

  // ============================================
  // Table Display
  // ============================================

  /**
   * Display tabular data
   */
  table(data: Record<string, unknown>[], options?: { title?: string }): this {
    if (data.length === 0) return this

    const firstRow = data[0]
    if (!firstRow) return this

    // Extract headers from first row
    const headers = Object.keys(firstRow)

    // Convert data to string rows
    const rows = data.map((row) => headers.map((h) => String(row[h] ?? '')))

    const message: TableMessageData = {
      id: generateId(),
      type: 'table',
      timestamp: new Date(),
      headers,
      rows,
      title: options?.title,
    }
    this.screen.addMessage(message)
    return this
  }
}
