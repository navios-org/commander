import type { LogLevel } from '@navios/core'
import type { RGBA, SyntaxStyle, TreeSitterClient } from '@opentui/core'
import type { ReactNode } from 'react'

import type { LogLevelColorMap } from './log.types.ts'
import type { Theme, ThemePreset } from './theme.types.ts'

// ============================================
// Screen Component Types
// ============================================

export interface ScreenProps {
  /** Screen title/name displayed in header */
  name: string

  /** Child log messages/file logs */
  children: ReactNode

  /** Enable auto-scroll to bottom on new content */
  stickyScroll?: boolean

  /** Show scroll position indicator */
  showScrollIndicator?: boolean

  /** Screen header background color */
  headerBackgroundColor?: string | RGBA

  /** Screen header text color */
  headerTextColor?: string | RGBA

  /** Whether this screen is currently focused */
  focused?: boolean

  /** Callback when screen is scrolled */
  onScroll?: (scrollTop: number, scrollHeight: number) => void
}

// ============================================
// ScreenManager Component Types
// ============================================

export interface ScreenDefinition {
  /** Unique screen identifier */
  id: string

  /** Display name for sidebar */
  name: string

  /** Optional icon/badge character */
  icon?: string

  /** Unread/notification count */
  badgeCount?: number
}

export interface ScreenManagerProps {
  /** Screen definitions for the sidebar */
  screens: ScreenDefinition[]

  /** Currently active screen ID */
  activeScreenId: string

  /** Callback when screen selection changes */
  onScreenChange?: (screenId: string) => void

  /** Screen content - should be conditionally rendered based on activeScreenId */
  children: ReactNode

  /** Force show/hide sidebar (overrides auto behavior) */
  sidebarVisible?: boolean

  /** Callback when sidebar visibility changes */
  onSidebarVisibilityChange?: (visible: boolean) => void

  /** Sidebar width (columns) */
  sidebarWidth?: number

  /** Sidebar position */
  sidebarPosition?: 'left' | 'right'

  /** Key to toggle sidebar visibility */
  toggleSidebarKey?: string

  /** Sidebar header title */
  sidebarTitle?: string
}

export type FocusArea = 'sidebar' | 'content'

// ============================================
// Context Types
// ============================================

export interface LoggerContextValue {
  /** Shared SyntaxStyle instance for code highlighting */
  syntaxStyle?: SyntaxStyle

  /** Shared TreeSitterClient for parsing */
  treeSitterClient?: TreeSitterClient

  /** Default colors for log levels (derived from theme for backwards compatibility) */
  levelColors: LogLevelColorMap

  /** Current theme */
  theme: Theme
}

// ============================================
// Screen Service Types
// ============================================

export type ScreenStatus = 'waiting' | 'pending' | 'success' | 'fail' | 'static'

export interface BindOptions {
  exitOnCtrlC?: boolean
  sidebarWidth?: number
  sidebarPosition?: 'left' | 'right'
  sidebarTitle?: string
  /** Auto close after all screens complete successfully (delay in ms, default 5000) */
  autoClose?: boolean | number
  /** Theme to use for the TUI (theme object or preset name) */
  theme?: Theme | ThemePreset
  /** Enable mouse support (default: true) */
  useMouse?: boolean
  /**
   * Use OpenTUI for terminal rendering.
   * When true: Full TUI with sidebar, scrolling, interactive prompts.
   * When false: Stdout mode - static screens print immediately, others on completion.
   * Default: true for Node.js, false for Bun (OpenTUI not supported).
   */
  useOpenTUI?: boolean
}

export interface SetupOptions {
  /** Theme to use for the TUI (theme object or preset name) */
  theme?: Theme | ThemePreset
  /** Global log levels filter - only these levels will be displayed across all loggers */
  logLevels?: LogLevel[]
}
