import type { LogLevel } from '@navios/core'

// ============================================
// Theme Type Definitions
// ============================================

/**
 * Color scheme for a single log level.
 */
export interface LogLevelTheme {
  border: string
  background: string
  text?: string
}

/**
 * Sidebar color scheme.
 */
export interface SidebarTheme {
  background?: string
  selectedBackground: string
  hoverBackground: string
  text: string
  textDim: string
  border: string
  badge: string
  focusBorder: string
}

/**
 * Screen header color scheme.
 */
export interface HeaderTheme {
  background?: string
  text: string
  border: string
}

/**
 * Status indicator with icon and color.
 */
export interface StatusIndicator {
  icon: string
  color: string
}

/**
 * Status indicators for all screen states.
 */
export interface StatusIndicatorsTheme {
  waiting: StatusIndicator
  pending: StatusIndicator
  success: StatusIndicator
  fail: StatusIndicator
  static: StatusIndicator
}

/**
 * Separator colors for sidebar sections.
 */
export interface SeparatorTheme {
  line: string
  text: string
}

/**
 * Progress bar and loading indicator colors.
 */
export interface ProgressTheme {
  border: string
  background: string
  barFilled: string
  barEmpty: string
  text: string
  textDim: string
  complete: string
  completeBackground: string
  failed: string
  failedBackground: string
}

/**
 * Collapsible group colors.
 */
export interface GroupTheme {
  border: string
  background: string
  headerText: string
  icon: string
}

/**
 * Table display colors.
 */
export interface TableTheme {
  border: string
  background: string
  headerText: string
  cellText: string
  title: string
  separator: string
}

/**
 * File display colors.
 */
export interface FileTheme {
  border: string
  background: string
  headerText: string
  headerBackground: string
}

/**
 * Interactive prompt colors.
 */
export interface PromptTheme {
  question: string
  optionText: string
  optionTextDim: string
  optionSelected: string
  optionSelectedBackground: string
  confirmButton: string
  cancelButton: string
  buttonBackground: string
  buttonSelectedBackground: string
  inputBorder: string
  inputBackground: string
  inputText: string
  inputPlaceholder: string
  inputCursor: string
  border: string
  focusBorder: string
}

/**
 * Error highlighting colors for file displays.
 */
export interface ErrorHighlightTheme {
  background: string
  border: string
  gutterBackground: string
}

/**
 * Filter bar colors.
 */
export interface FilterTheme {
  background: string
  border: string
  text: string
  textDim: string
  inputBackground: string
  inputText: string
  inputPlaceholder: string
  cursor: string
  activeLevel: string
  inactiveLevel: string
}

/**
 * Help overlay colors.
 */
export interface HelpTheme {
  background: string
  border: string
  title: string
  category: string
  key: string
  description: string
  hint: string
}

/**
 * General semantic colors.
 */
export interface SemanticColors {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  muted: string
  background?: string
  foreground: string
}

/**
 * Complete theme definition.
 */
export interface Theme {
  /** Theme identifier */
  name: string

  /** Log level color schemes */
  logLevels: Record<LogLevel, LogLevelTheme>

  /** Sidebar colors */
  sidebar: SidebarTheme

  /** Screen header colors */
  header: HeaderTheme

  /** Status indicator colors and icons */
  statusIndicators: StatusIndicatorsTheme

  /** Separator colors */
  separator: SeparatorTheme

  /** Progress bar colors */
  progress: ProgressTheme

  /** Collapsible group colors */
  group: GroupTheme

  /** Table display colors */
  table: TableTheme

  /** File display colors */
  file: FileTheme

  /** Prompt colors */
  prompt: PromptTheme

  /** Error highlighting colors */
  errorHighlight: ErrorHighlightTheme

  /** Filter bar colors */
  filter: FilterTheme

  /** Help overlay colors */
  help: HelpTheme

  /** General semantic colors */
  colors: SemanticColors
}

/**
 * Theme preset names.
 */
export type ThemePreset = 'dark' | 'light' | 'high-contrast'

/**
 * Deep partial type for theme overrides.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Partial theme for creating custom themes.
 */
export type PartialTheme = DeepPartial<Theme>
