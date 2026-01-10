import { TextAttributes } from '@opentui/core'

import { useTheme } from '../../hooks/index.ts'
import { VARIANT_COLORS } from '../../utils/index.ts'

import type { LogMessageProps } from '../../types/index.ts'

/**
 * LogMessage - A chat-like styled log message with level-based coloring.
 *
 * Features:
 * - Left border with prominent color based on log level
 * - Subtle tinted background matching the log level
 * - Optional timestamp and label display
 * - Supports both simple text and complex React children
 * - Optional variant for semantic styling (e.g., 'success', 'trace')
 *
 * @example
 * <LogMessage level="error">
 *   Connection failed: timeout after 30s
 * </LogMessage>
 *
 * @example
 * <LogMessage level="log" timestamp={new Date()} label="API">
 *   Request completed successfully
 * </LogMessage>
 *
 * @example
 * <LogMessage level="log" variant="success">
 *   Operation completed successfully
 * </LogMessage>
 */
export function LogMessage({
  level,
  variant,
  children,
  timestamp,
  label,
  trace,
  borderColor: customBorderColor,
  backgroundColor: customBackgroundColor,
  borderStyle = 'thin',
  padding = 1,
  margin = 0,
}: LogMessageProps) {
  const theme = useTheme()

  // Get colors: variant colors take precedence over level colors
  const levelColors = variant ? VARIANT_COLORS[variant] : theme.logLevels[level]

  // Resolve final colors (custom overrides level colors)
  const borderColor = customBorderColor ?? levelColors.border
  const backgroundColor = customBackgroundColor ?? levelColors.background

  // Text color: use level-specific text color if defined, otherwise use foreground
  const textColor = levelColors.text ?? theme.colors.foreground

  // Determine border sides based on style
  const borderSides: ('left' | 'top' | 'bottom')[] =
    borderStyle === 'thin' ? ['left'] : ['left', 'top', 'bottom']

  // Format timestamp if provided
  const formattedTimestamp = timestamp
    ? timestamp instanceof Date
      ? timestamp.toLocaleTimeString()
      : timestamp
    : null

  return (
    <box
      flexDirection="column"
      border={borderSides}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      paddingLeft={padding}
      paddingRight={padding}
      marginBottom={margin}
    >
      {/* Header row with timestamp and label */}
      {(formattedTimestamp || label) && (
        <box flexDirection="row" gap={1}>
          {formattedTimestamp && <text fg={theme.colors.muted}>{formattedTimestamp}</text>}
          {label && (
            <text fg={levelColors.border} attributes={TextAttributes.BOLD}>
              [{label}]
            </text>
          )}
        </box>
      )}

      {/* Message content */}
      <text fg={textColor}>{children}</text>

      {/* Stack trace (for trace level) */}
      {trace && (
        <box marginTop={1}>
          <text fg={theme.colors.muted}>{trace}</text>
        </box>
      )}
    </box>
  )
}
