// ============================================
// Filter Types
// ============================================

import type { LogLevel } from '@navios/core'

/**
 * Filter state for log filtering.
 */
export interface FilterState {
  /** Which log levels are enabled (shown) */
  enabledLevels: Set<LogLevel>

  /** Text search query */
  searchQuery: string

  /** Whether the filter bar is visible */
  isVisible: boolean

  /** Which filter field is focused */
  focusedField: 'search' | 'levels'
}

/**
 * All log levels in order.
 */
export const ALL_LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']

/**
 * Create a default filter state.
 */
export function createDefaultFilterState(): FilterState {
  return {
    enabledLevels: new Set(ALL_LOG_LEVELS),
    searchQuery: '',
    isVisible: false,
    focusedField: 'search',
  }
}

/**
 * Check if any filtering is active.
 */
export function hasActiveFilter(filter: FilterState): boolean {
  return filter.searchQuery !== '' || filter.enabledLevels.size < ALL_LOG_LEVELS.length
}

/**
 * Level counts for display.
 */
export type LevelCounts = Record<LogLevel, number>
