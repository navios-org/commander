import { useState, useCallback } from 'react'

import { ALL_LOG_LEVELS, createDefaultFilterState, type FilterState } from '../../../types/index.ts'

/**
 * Filter state actions returned by useFilterState hook
 */
export interface FilterStateActions {
  toggleFilter: () => void
  closeFilter: () => void
  filterAppendChar: (char: string) => void
  filterDeleteChar: () => void
  filterToggleLevel: (index: number) => void
  filterCycleField: () => void
}

/**
 * Hook to manage filter state for log filtering.
 * Provides state and memoized action handlers.
 */
export function useFilterState(): [FilterState, FilterStateActions] {
  const [filter, setFilter] = useState<FilterState>(createDefaultFilterState)

  const toggleFilter = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
      focusedField: 'search',
    }))
  }, [])

  const closeFilter = useCallback(() => {
    setFilter((prev) => ({ ...prev, isVisible: false }))
  }, [])

  const filterAppendChar = useCallback((char: string) => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery + char,
    }))
  }, [])

  const filterDeleteChar = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery.slice(0, -1),
    }))
  }, [])

  const filterToggleLevel = useCallback((index: number) => {
    setFilter((prev) => {
      const level = ALL_LOG_LEVELS[index]
      if (!level) return prev

      const newLevels = new Set(prev.enabledLevels)
      if (newLevels.has(level)) {
        newLevels.delete(level)
      } else {
        newLevels.add(level)
      }

      return { ...prev, enabledLevels: newLevels }
    })
  }, [])

  const filterCycleField = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      focusedField: prev.focusedField === 'search' ? 'levels' : 'search',
    }))
  }, [])

  return [
    filter,
    {
      toggleFilter,
      closeFilter,
      filterAppendChar,
      filterDeleteChar,
      filterToggleLevel,
      filterCycleField,
    },
  ]
}
