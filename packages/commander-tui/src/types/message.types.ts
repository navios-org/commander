import type { LogLevel } from '@navios/core'

// ============================================
// Internal Message Types
// ============================================

export type MessageType =
  | 'log'
  | 'file'
  | 'diff'
  | 'fileError'
  | 'loading'
  | 'progress'
  | 'group'
  | 'table'

export interface BaseMessage {
  id: string
  type: MessageType
  timestamp: Date
}

/**
 * Semantic variants for log messages that don't map directly to LogLevel.
 * These affect styling but the underlying LogLevel is used for filtering.
 */
export type LogMessageVariant = 'success' | 'trace'

export interface LogMessageData extends BaseMessage {
  type: 'log'
  level: LogLevel
  /** Content is always a string - objects are formatted before storage */
  content: string
  label?: string
  trace?: string
  /** Optional semantic variant for styling (e.g., 'success' shows green even though level is 'log') */
  variant?: LogMessageVariant
}

export interface FileMessageData extends BaseMessage {
  type: 'file'
  filePath: string
  content: string
}

export interface DiffMessageData extends BaseMessage {
  type: 'diff'
  filePath: string
  diff: string
  view?: 'unified' | 'split'
}

export interface FileErrorMessageData extends BaseMessage {
  type: 'fileError'
  filePath: string
  content: string
  errorLines: number[]
  startLine: number
}

export interface LoadingMessageData extends BaseMessage {
  type: 'loading'
  content: string
  status: 'loading' | 'success' | 'fail'
  resolvedContent?: string
}

export interface ProgressMessageData extends BaseMessage {
  type: 'progress'
  label: string
  current: number
  total: number
  status: 'active' | 'complete' | 'failed'
  resolvedContent?: string
}

export interface GroupMessageData extends BaseMessage {
  type: 'group'
  label: string
  collapsed: boolean
  isEnd: boolean
}

export interface TableMessageData extends BaseMessage {
  type: 'table'
  headers: string[]
  rows: string[][]
  title?: string
}

export type MessageData =
  | LogMessageData
  | FileMessageData
  | DiffMessageData
  | FileErrorMessageData
  | LoadingMessageData
  | ProgressMessageData
  | GroupMessageData
  | TableMessageData

// ============================================
// Logger Handle Types
// ============================================

export interface PromiseOptions<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: Error) => string)
}

export interface LoadingHandle {
  success: (message: string) => void
  fail: (message: string) => void
}

export interface ProgressHandle {
  update: (current: number, label?: string) => void
  complete: (message?: string) => void
  fail: (message?: string) => void
}
