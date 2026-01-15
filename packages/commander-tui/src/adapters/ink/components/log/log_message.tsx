import { Box, Text } from 'ink'

import { useTheme } from '../../hooks/index.ts'
import { VARIANT_COLORS } from '../../../../utils/index.ts'

import type { LogMessageProps } from '../../../../types/index.ts'

// Helper to convert RGBA or string to a string color (Ink only supports string colors)
function toStringColor(color: string | { r: number; g: number; b: number; a?: number }): string {
  if (typeof color === 'string') return color
  // Convert RGBA object to hex string
  const { r, g, b } = color
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * LogMessage - A chat-like styled log message with level-based coloring.
 *
 * Features:
 * - Left border indicator with color based on log level
 * - Optional timestamp and label display
 * - Supports both simple text and complex React children
 * - Optional variant for semantic styling (e.g., 'success', 'trace')
 *
 * Note: Ink's Box doesn't support partial borders like OpenTUI, so we use
 * a colored text character as a left border indicator.
 */
export function LogMessage({
  level,
  variant,
  children,
  timestamp,
  label,
  trace,
  borderColor: customBorderColor,
  borderStyle = 'thin',
  padding = 1,
  margin = 0,
}: LogMessageProps) {
  const theme = useTheme()

  // Get colors: variant colors take precedence over level colors
  const levelColors = variant ? VARIANT_COLORS[variant] : theme.logLevels[level]

  // Resolve final colors (custom overrides level colors, convert to string for Ink)
  const borderColor = toStringColor(customBorderColor ?? levelColors.border)

  // Text color: use level-specific text color if defined, otherwise use foreground
  const textColor = levelColors.text ?? theme.colors.foreground

  // Format timestamp if provided
  const formattedTimestamp = timestamp
    ? timestamp instanceof Date
      ? timestamp.toLocaleTimeString()
      : timestamp
    : null

  // Border character: thicker for 'thick' style
  const borderChar = borderStyle === 'thin' ? '│' : '┃'

  // Helper to render a line with left border
  const BorderedLine = ({ children: lineContent }: { children: React.ReactNode }) => (
    <Box flexDirection="row">
      <Text color={borderColor}>{borderChar}</Text>
      <Box paddingLeft={padding} paddingRight={padding}>
        {lineContent}
      </Box>
    </Box>
  )

  return (
    <Box flexDirection="column" marginBottom={margin}>
      {/* Header row with timestamp and label */}
      {(formattedTimestamp || label) && (
        <BorderedLine>
          <Box flexDirection="row" gap={1}>
            {formattedTimestamp && <Text color={theme.colors.muted}>{formattedTimestamp}</Text>}
            {label && (
              <Text color={borderColor} bold>
                [{label}]
              </Text>
            )}
          </Box>
        </BorderedLine>
      )}

      {/* Message content */}
      <BorderedLine>
        <Text color={textColor}>{children}</Text>
      </BorderedLine>

      {/* Stack trace (for trace level) */}
      {trace && (
        <BorderedLine>
          <Text color={theme.colors.muted}>{trace}</Text>
        </BorderedLine>
      )}
    </Box>
  )
}
