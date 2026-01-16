import { VARIANT_COLORS } from '@navios/commander-tui'
import { TextAttributes } from '@opentui/core'
import { Show, type JSX } from 'solid-js'

import type { LogMessageProps } from '@navios/commander-tui'

import { useTheme } from '../../hooks/index.ts'

/**
 * LogMessage - A chat-like styled log message with level-based coloring.
 *
 * Features:
 * - Left border with prominent color based on log level
 * - Subtle tinted background matching the log level
 * - Optional timestamp and label display
 * - Supports both simple text and complex children
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
export function LogMessage(props: LogMessageProps & { children?: JSX.Element }) {
  const theme = useTheme()

  // Get colors: variant colors take precedence over level colors
  const levelColors = () =>
    props.variant ? VARIANT_COLORS[props.variant] : theme.logLevels[props.level]

  // Resolve final colors (custom overrides level colors)
  const borderColor = () => props.borderColor ?? levelColors().border
  const backgroundColor = () => props.backgroundColor ?? levelColors().background

  // Text color: use level-specific text color if defined, otherwise use foreground
  const textColor = () => levelColors().text ?? theme.colors.foreground

  // Determine border sides based on style
  const borderSides = (): ('left' | 'top' | 'bottom')[] =>
    props.borderStyle === 'thin' || props.borderStyle === undefined
      ? ['left']
      : ['left', 'top', 'bottom']

  // Format timestamp if provided
  const formattedTimestamp = () => {
    if (!props.timestamp) return null
    return props.timestamp instanceof Date ? props.timestamp.toLocaleTimeString() : props.timestamp
  }

  return (
    <box
      flexDirection="column"
      border={borderSides()}
      borderColor={borderColor()}
      backgroundColor={backgroundColor()}
      paddingLeft={props.padding ?? 1}
      paddingRight={props.padding ?? 1}
      marginBottom={props.margin ?? 0}
    >
      {/* Header row with timestamp and label */}
      <Show when={formattedTimestamp() || props.label}>
        <box flexDirection="row" gap={1}>
          <Show when={formattedTimestamp()}>
            <text fg={theme.colors.muted}>{formattedTimestamp()}</text>
          </Show>
          <Show when={props.label}>
            <text fg={levelColors().border} attributes={TextAttributes.BOLD}>
              [{props.label}]
            </text>
          </Show>
        </box>
      </Show>

      {/* Message content */}
      <text fg={textColor()}>{props.children}</text>

      {/* Stack trace (for trace level) */}
      <Show when={props.trace}>
        <box marginTop={1}>
          <text fg={theme.colors.muted}>{props.trace}</text>
        </box>
      </Show>
    </box>
  )
}
