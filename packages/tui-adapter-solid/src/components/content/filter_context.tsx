import { ALL_LOG_LEVELS, createDefaultFilterState } from '@navios/commander-tui'
import { createContext, useContext, createSignal, type JSX, type Accessor } from 'solid-js'

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
  filter: Accessor<FilterState>
  actions: FilterActions
}

const FilterContext = createContext<FilterContextValue>()

export interface FilterProviderProps {
  children: JSX.Element
}

/**
 * Provider for filter state and actions.
 * Allows both ContentArea and keyboard handler to access filter functionality.
 */
export function FilterProvider(props: FilterProviderProps) {
  const [filter, setFilter] = createSignal<FilterState>(createDefaultFilterState())

  const toggleFilter = () => {
    setFilter((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
      focusedField: 'search',
    }))
  }

  const closeFilter = () => {
    setFilter((prev) => ({ ...prev, isVisible: false }))
  }

  const filterAppendChar = (char: string) => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery + char,
    }))
  }

  const filterDeleteChar = () => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: prev.searchQuery.slice(0, -1),
    }))
  }

  const filterToggleLevel = (index: number) => {
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
  }

  const filterCycleField = () => {
    setFilter((prev) => ({
      ...prev,
      focusedField: prev.focusedField === 'search' ? 'levels' : 'search',
    }))
  }

  // Create stable actions object (functions don't change)
  const actions: FilterActions = {
    toggleFilter,
    closeFilter,
    filterAppendChar,
    filterDeleteChar,
    filterToggleLevel,
    filterCycleField,
  }

  // Create stable context value to prevent unnecessary re-renders
  const value: FilterContextValue = { filter, actions }

  return <FilterContext.Provider value={value}>{props.children}</FilterContext.Provider>
}

export function useFilter(): Accessor<FilterState> {
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
