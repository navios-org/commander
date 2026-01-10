import { useMemo } from 'react'

import { useLoggerContext } from '../../context/index.ts'
import { ERROR_HIGHLIGHT_COLORS, HEADER_COLORS, resolveFiletype } from '../../utils/index.ts'

import type {
  FileLogProps,
  FileLogFullProps,
  FileLogDiffProps,
  FileLogPartialProps,
} from '../../types/index.ts'

/**
 * FileLog - Displays file content, diffs, or partial files with error highlighting.
 *
 * Three modes:
 * 1. "full" - Display complete file with syntax highlighting
 * 2. "diff" - Display unified diff using <diff> component
 * 3. "partial" - Display file excerpt with optional error line highlighting
 *
 * @example Full file
 * <FileLog
 *   mode="full"
 *   filePath="src/index.ts"
 *   content={fileContent}
 * />
 *
 * @example Diff
 * <FileLog
 *   mode="diff"
 *   filePath="src/api.ts"
 *   diff={unifiedDiff}
 *   view="unified"
 * />
 *
 * @example Partial with error
 * <FileLog
 *   mode="partial"
 *   filePath="src/utils.ts"
 *   content={excerpt}
 *   startLine={42}
 *   errorLines={[45, 46]}
 * />
 */
export function FileLog(props: FileLogProps) {
  const { syntaxStyle, treeSitterClient } = useLoggerContext()

  // Auto-detect filetype from path
  const filetype = props.filetype ?? resolveFiletype(props.filePath)
  const showHeader = props.showHeader ?? true
  const showLineNumbers = props.showLineNumbers ?? true

  return (
    <box flexDirection="column" marginBottom={1}>
      {/* File header */}
      {showHeader && (
        <box
          backgroundColor={props.headerBackgroundColor ?? HEADER_COLORS.background}
          paddingLeft={1}
          paddingRight={1}
          border={['bottom']}
          borderColor={HEADER_COLORS.border}
        >
          <text fg={HEADER_COLORS.text}>{props.filePath}</text>
        </box>
      )}

      {/* Content based on mode */}
      {props.mode === 'full' && (
        <FileLogFull
          {...props}
          filetype={filetype}
          syntaxStyle={syntaxStyle}
          treeSitterClient={treeSitterClient}
          showLineNumbers={showLineNumbers}
        />
      )}

      {props.mode === 'diff' && (
        <FileLogDiff
          {...props}
          filetype={filetype}
          syntaxStyle={syntaxStyle}
          treeSitterClient={treeSitterClient}
        />
      )}

      {props.mode === 'partial' && (
        <FileLogPartial
          {...props}
          filetype={filetype}
          syntaxStyle={syntaxStyle}
          treeSitterClient={treeSitterClient}
          showLineNumbers={showLineNumbers}
        />
      )}
    </box>
  )
}

interface FileLogInternalProps {
  filetype?: string
  syntaxStyle?: ReturnType<typeof useLoggerContext>['syntaxStyle']
  treeSitterClient?: ReturnType<typeof useLoggerContext>['treeSitterClient']
}

/**
 * Full file display with syntax highlighting.
 */
function FileLogFull({
  content,
  filetype,
  syntaxStyle,
  treeSitterClient,
}: FileLogFullProps & FileLogInternalProps) {
  if (!syntaxStyle) {
    // Fallback to plain text display if no syntax style available
    return (
      <box paddingLeft={1} paddingRight={1}>
        <text>{content}</text>
      </box>
    )
  }

  return (
    <code
      content={content}
      filetype={filetype}
      syntaxStyle={syntaxStyle}
      treeSitterClient={treeSitterClient}
    />
  )
}

/**
 * Diff display using the built-in <diff> component.
 */
function FileLogDiff({
  diff,
  view = 'unified',
  filetype,
  syntaxStyle,
  treeSitterClient,
}: FileLogDiffProps & FileLogInternalProps) {
  if (!syntaxStyle) {
    // Fallback to plain text display if no syntax style available
    return (
      <box paddingLeft={1} paddingRight={1}>
        <text>{diff}</text>
      </box>
    )
  }

  return (
    <diff
      diff={diff}
      view={view}
      filetype={filetype}
      syntaxStyle={syntaxStyle}
      treeSitterClient={treeSitterClient}
    />
  )
}

/**
 * Partial file display with error line highlighting.
 *
 * This component renders a file excerpt and highlights specific lines
 * as errors using box overlays with colored backgrounds.
 */
function FileLogPartial({
  content,
  startLine,
  errorLines = [],
  errorLineBackground,
  errorLineBorderColor,
  filetype,
  syntaxStyle,
  treeSitterClient,
  showLineNumbers,
}: FileLogPartialProps & FileLogInternalProps) {
  // Parse content into lines for error highlighting
  const lines = useMemo(() => content.split('\n'), [content])

  // Calculate which lines are errors (relative to startLine)
  const errorLineSet = useMemo(() => new Set(errorLines), [errorLines])

  // Error colors
  const errorBg = errorLineBackground ?? ERROR_HIGHLIGHT_COLORS.background
  const errorBorder = errorLineBorderColor ?? ERROR_HIGHLIGHT_COLORS.border

  // Line number width based on max line number
  const maxLineNum = startLine + lines.length - 1
  const lineNumWidth = Math.max(4, String(maxLineNum).length + 1)

  return (
    <box flexDirection="column">
      {lines.map((line, index) => {
        const lineNumber = startLine + index
        const isError = errorLineSet.has(lineNumber)

        return (
          <box
            key={lineNumber}
            flexDirection="row"
            backgroundColor={isError ? errorBg : undefined}
            border={isError ? ['left'] : undefined}
            borderColor={isError ? errorBorder : undefined}
          >
            {/* Line number gutter */}
            {showLineNumbers && (
              <box
                width={lineNumWidth}
                backgroundColor={
                  isError ? ERROR_HIGHLIGHT_COLORS.gutterBackground : HEADER_COLORS.background
                }
                paddingRight={1}
              >
                <text fg="#6B7280">{String(lineNumber).padStart(lineNumWidth - 1)}</text>
              </box>
            )}

            {/* Code line */}
            <box flexGrow={1} paddingLeft={1}>
              {syntaxStyle ? (
                <code
                  content={line}
                  filetype={filetype}
                  syntaxStyle={syntaxStyle}
                  treeSitterClient={treeSitterClient}
                />
              ) : (
                <text>{line}</text>
              )}
            </box>
          </box>
        )
      })}
    </box>
  )
}
