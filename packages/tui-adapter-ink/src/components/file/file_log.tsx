import { Box, Text } from 'ink'
import SyntaxHighlight from 'ink-syntax-highlight'
import { useMemo } from 'react'

import { useTheme } from '../../hooks/index.ts'

// Map file extensions to highlight.js language names
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  sql: 'sql',
  md: 'markdown',
  dockerfile: 'dockerfile',
  toml: 'toml',
  ini: 'ini',
  conf: 'ini',
}

function getLanguageFromPath(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (!ext) return undefined

  // Check for special filenames
  const filename = filePath.split('/').pop()?.toLowerCase()
  if (filename === 'dockerfile') return 'dockerfile'

  return EXTENSION_TO_LANGUAGE[ext]
}

export interface FileLogFullProps {
  mode: 'full'
  filePath: string
  content: string
  headerBackgroundColor?: string
}

export interface FileLogDiffProps {
  mode: 'diff'
  filePath: string
  diff: string
  view?: 'unified' | 'split'
  headerBackgroundColor?: string
}

export interface FileLogPartialProps {
  mode: 'partial'
  filePath: string
  content: string
  startLine: number
  errorLines?: number[]
  headerBackgroundColor?: string
}

export type FileLogProps = FileLogFullProps | FileLogDiffProps | FileLogPartialProps

/**
 * FileLog component for Ink adapter.
 * Uses ink-syntax-highlight for code syntax highlighting.
 */
export function FileLog(props: FileLogProps) {
  if (props.mode === 'full') {
    return <FileLogFull {...props} />
  } else if (props.mode === 'diff') {
    return <FileLogDiff {...props} />
  } else {
    return <FileLogPartial {...props} />
  }
}

function FileLogFull({ filePath, content, headerBackgroundColor }: FileLogFullProps) {
  const theme = useTheme()
  const lines = content.split('\n')
  const language = useMemo(() => getLanguageFromPath(filePath), [filePath])

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box backgroundColor={headerBackgroundColor} paddingLeft={1} paddingRight={1}>
        <Text color={theme.file.headerText} bold>
          {filePath}
        </Text>
      </Box>

      {/* Content with syntax highlighting */}
      <Box flexDirection="column" paddingLeft={1}>
        {lines.map((line, i) => (
          <Box key={i} flexDirection="row">
            <Text color={theme.colors.muted} dimColor>
              {String(i + 1).padStart(4)} │{' '}
            </Text>
            {language ? <SyntaxHighlight language={language} code={line} /> : <Text>{line}</Text>}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function FileLogDiff({ filePath, diff, headerBackgroundColor }: FileLogDiffProps) {
  const theme = useTheme()
  const lines = diff.split('\n')

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box backgroundColor={headerBackgroundColor} paddingLeft={1} paddingRight={1}>
        <Text color={theme.file.headerText} bold>
          {filePath} (diff)
        </Text>
      </Box>

      {/* Diff content */}
      <Box flexDirection="column" paddingLeft={1}>
        {lines.map((line, i) => {
          let color = theme.colors.foreground
          if (line.startsWith('+') && !line.startsWith('+++')) {
            color = '#22c55e' // green for additions
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            color = '#ef4444' // red for deletions
          } else if (line.startsWith('@@')) {
            color = '#3b82f6' // blue for hunk headers
          }

          return (
            <Text key={i} color={color}>
              {line}
            </Text>
          )
        })}
      </Box>
    </Box>
  )
}

function FileLogPartial({
  filePath,
  content,
  startLine,
  errorLines = [],
  headerBackgroundColor,
}: FileLogPartialProps) {
  const theme = useTheme()
  const lines = content.split('\n')
  const errorLineSet = new Set(errorLines)
  const language = useMemo(() => getLanguageFromPath(filePath), [filePath])

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box backgroundColor={headerBackgroundColor} paddingLeft={1} paddingRight={1}>
        <Text color={theme.file.headerText} bold>
          {filePath}:{startLine}
        </Text>
      </Box>

      {/* Content with error highlighting and syntax highlighting */}
      <Box flexDirection="column" paddingLeft={1}>
        {lines.map((line, i) => {
          const lineNum = startLine + i
          const isErrorLine = errorLineSet.has(lineNum)

          return (
            <Box key={i} flexDirection="row">
              <Text color={isErrorLine ? theme.colors.error : theme.colors.muted}>
                {String(lineNum).padStart(4)} │{' '}
              </Text>
              {isErrorLine ? (
                <Text backgroundColor={theme.errorHighlight.background}>{line}</Text>
              ) : language ? (
                <SyntaxHighlight language={language} code={line} />
              ) : (
                <Text>{line}</Text>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
