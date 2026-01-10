import type { RGBA } from '@opentui/core'

// ============================================
// FileLog Component Types
// ============================================

export type FileLogMode = 'full' | 'diff' | 'partial'

export interface FileLogBaseProps {
  /** File path or name to display in header */
  filePath: string

  /** Override auto-detected filetype for syntax highlighting */
  filetype?: string

  /** Show line numbers */
  showLineNumbers?: boolean

  /** Show header with file path */
  showHeader?: boolean

  /** Custom header background color */
  headerBackgroundColor?: string | RGBA
}

export interface FileLogFullProps extends FileLogBaseProps {
  mode: 'full'

  /** The complete file content */
  content: string
}

export interface FileLogDiffProps extends FileLogBaseProps {
  mode: 'diff'

  /** Unified diff string */
  diff: string

  /** Diff view mode */
  view?: 'unified' | 'split'
}

export interface FileLogPartialProps extends FileLogBaseProps {
  mode: 'partial'

  /** File content (full or partial) */
  content: string

  /** Starting line number of the content (1-indexed) */
  startLine: number

  /** Lines to highlight as errors */
  errorLines?: number[]

  /** Error highlighting colors */
  errorLineBackground?: string | RGBA
  errorLineBorderColor?: string | RGBA
}

export type FileLogProps = FileLogFullProps | FileLogDiffProps | FileLogPartialProps
