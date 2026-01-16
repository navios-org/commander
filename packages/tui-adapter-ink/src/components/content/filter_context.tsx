import { ALL_LOG_LEVELS, createDefaultFilterState } from '@navios/commander-tui'
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'

import type { FilterState } from '@navios/commander-tui'

export interface FilterActions {
  toggleFilter: () => void
  closeFilter: () => void
  filterAppendChar: (char: string) => void
  filterDeleteChar: () => void
  filterToggleLevel: (index: number) => void
  filterCycleField: () => void
}

interface FilterContextValue {
  filter: FilterState
  actions: FilterActions
}

const FilterContext = createContext<FilterContextValue | null>(null)

export interface FilterProviderProps {
  children: ReactNode
}

/**
 * Provider for filter state and actions.
 * Allows both ContentArea and keyboard handler to access filter functionality.
 */
export function FilterProvider({ children }: FilterProviderProps) {
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

  const actions = useMemo(
    () => ({
      toggleFilter,
      closeFilter,
      filterAppendChar,
      filterDeleteChar,
      filterToggleLevel,
      filterCycleField,
    }),
    [
      toggleFilter,
      closeFilter,
      filterAppendChar,
      filterDeleteChar,
      filterToggleLevel,
      filterCycleField,
    ],
  )

  const value = useMemo(() => ({ filter, actions }), [filter, actions])

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilter(): FilterState {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider')
  }
  return context.filter
}

export function useFilterActions(): FilterActions {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilterActions must be used within FilterProvider')
  }
  return context.actions
}
