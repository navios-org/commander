import { Show, For, createMemo } from 'solid-js'

import { useLoggerContext } from '../../context/index.ts'
import { ERROR_HIGHLIGHT_COLORS, HEADER_COLORS, resolveFiletype } from '../../../../utils/index.ts'

import type {
  FileLogProps,
  FileLogFullProps,
  FileLogDiffProps,
  FileLogPartialProps,
} from '../../../../types/index.ts'

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
  const filetype = () => props.filetype ?? resolveFiletype(props.filePath)
  const showHeader = () => props.showHeader ?? true
  const showLineNumbers = () => props.showLineNumbers ?? true

  return (
    <box flexDirection="column" marginBottom={1}>
      {/* File header */}
      <Show when={showHeader()}>
        <box
          backgroundColor={props.headerBackgroundColor ?? HEADER_COLORS.background}
          paddingLeft={1}
          paddingRight={1}
          border={['bottom']}
          borderColor={HEADER_COLORS.border}
        >
          <text fg={HEADER_COLORS.text}>{props.filePath}</text>
        </box>
      </Show>

      {/* Content based on mode */}
      <Show when={props.mode === 'full'}>
        <FileLogFull
          {...(props as FileLogFullProps)}
          filetype={filetype()}
          syntaxStyle={syntaxStyle}
          treeSitterClient={treeSitterClient}
          showLineNumbers={showLineNumbers()}
        />
      </Show>

      <Show when={props.mode === 'diff'}>
        <FileLogDiff
          {...(props as FileLogDiffProps)}
          filetype={filetype()}
          syntaxStyle={syntaxStyle}
          treeSitterClient={treeSitterClient}
        />
      </Show>

      <Show when={props.mode === 'partial'}>
        <FileLogPartial
          {...(props as FileLogPartialProps)}
          filetype={filetype()}
          syntaxStyle={syntaxStyle}
          treeSitterClient={treeSitterClient}
          showLineNumbers={showLineNumbers()}
        />
      </Show>
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
function FileLogFull(props: FileLogFullProps & FileLogInternalProps) {
  return (
    <Show
      when={props.syntaxStyle}
      fallback={
        <box paddingLeft={1} paddingRight={1}>
          <text>{props.content}</text>
        </box>
      }
    >
      <code
        content={props.content}
        filetype={props.filetype}
        syntaxStyle={props.syntaxStyle}
        treeSitterClient={props.treeSitterClient}
      />
    </Show>
  )
}

/**
 * Diff display using the built-in <diff> component.
 */
function FileLogDiff(props: FileLogDiffProps & FileLogInternalProps) {
  const view = () => props.view ?? 'unified'

  return (
    <Show
      when={props.syntaxStyle}
      fallback={
        <box paddingLeft={1} paddingRight={1}>
          <text>{props.diff}</text>
        </box>
      }
    >
      <diff
        diff={props.diff}
        view={view()}
        filetype={props.filetype}
        syntaxStyle={props.syntaxStyle}
        treeSitterClient={props.treeSitterClient}
      />
    </Show>
  )
}

/**
 * Partial file display with error line highlighting.
 *
 * This component renders a file excerpt and highlights specific lines
 * as errors using box overlays with colored backgrounds.
 */
function FileLogPartial(props: FileLogPartialProps & FileLogInternalProps) {
  // Parse content into lines for error highlighting
  const lines = createMemo(() => props.content.split('\n'))

  // Calculate which lines are errors (relative to startLine)
  const errorLineSet = createMemo(() => new Set(props.errorLines ?? []))

  // Error colors
  const errorBg = () => props.errorLineBackground ?? ERROR_HIGHLIGHT_COLORS.background
  const errorBorder = () => props.errorLineBorderColor ?? ERROR_HIGHLIGHT_COLORS.border

  // Line number width based on max line number
  const maxLineNum = () => props.startLine + lines().length - 1
  const lineNumWidth = () => Math.max(4, String(maxLineNum()).length + 1)

  return (
    <box flexDirection="column">
      <For each={lines()}>
        {(line, index) => {
          const lineNumber = () => props.startLine + index()
          const isError = () => errorLineSet().has(lineNumber())

          return (
            <box
              flexDirection="row"
              backgroundColor={isError() ? errorBg() : undefined}
              border={isError() ? ['left'] : undefined}
              borderColor={isError() ? errorBorder() : undefined}
            >
              {/* Line number gutter */}
              <Show when={props.showLineNumbers}>
                <box
                  width={lineNumWidth()}
                  backgroundColor={
                    isError() ? ERROR_HIGHLIGHT_COLORS.gutterBackground : HEADER_COLORS.background
                  }
                  paddingRight={1}
                >
                  <text fg="#6B7280">{String(lineNumber()).padStart(lineNumWidth() - 1)}</text>
                </box>
              </Show>

              {/* Code line */}
              <box flexGrow={1} paddingLeft={1}>
                <Show when={props.syntaxStyle} fallback={<text>{line}</text>}>
                  <code
                    content={line}
                    filetype={props.filetype}
                    syntaxStyle={props.syntaxStyle}
                    treeSitterClient={props.treeSitterClient}
                  />
                </Show>
              </box>
            </box>
          )
        }}
      </For>
    </box>
  )
}
