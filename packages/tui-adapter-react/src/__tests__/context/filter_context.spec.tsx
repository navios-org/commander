import { describe, it, expect } from 'bun:test'

import { ALL_LOG_LEVELS } from '@navios/commander-tui'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'

import {
  FilterProvider,
  useFilter,
  useFilterActions,
} from '../../components/content/filter_context.tsx'
// Import setup to apply mocks
import '../setup.ts'

// Helper to render hooks within FilterProvider
function renderFilterHook<T>(hook: () => T) {
  return renderHook(hook, {
    wrapper: ({ children }) => createElement(FilterProvider, null, children),
  })
}

describe('FilterProvider', () => {
  describe('initial state', () => {
    it('should provide default filter state', () => {
      const { result } = renderFilterHook(() => useFilter())

      expect(result.current.isVisible).toBe(false)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.focusedField).toBe('search')
      expect(result.current.enabledLevels).toBeDefined()
      expect(result.current.enabledLevels.size).toBe(ALL_LOG_LEVELS.length)
    })

    it('should have all log levels enabled by default', () => {
      const { result } = renderFilterHook(() => useFilter())

      for (const level of ALL_LOG_LEVELS) {
        expect(result.current.enabledLevels.has(level)).toBe(true)
      }
    })
  })

  describe('filter actions', () => {
    it('should provide all filter actions', () => {
      const { result } = renderFilterHook(() => useFilterActions())

      expect(result.current.toggleFilter).toBeDefined()
      expect(result.current.closeFilter).toBeDefined()
      expect(result.current.filterAppendChar).toBeDefined()
      expect(result.current.filterDeleteChar).toBeDefined()
      expect(result.current.filterToggleLevel).toBeDefined()
      expect(result.current.filterCycleField).toBeDefined()
    })
  })
})

describe('useFilter', () => {
  it('should throw error when used outside FilterProvider', () => {
    expect(() => {
      renderHook(() => useFilter())
    }).toThrow('useFilter must be used within FilterProvider')
  })

  it('should return filter state when used inside FilterProvider', () => {
    const { result } = renderFilterHook(() => useFilter())

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('isVisible')
    expect(result.current).toHaveProperty('searchQuery')
    expect(result.current).toHaveProperty('focusedField')
    expect(result.current).toHaveProperty('enabledLevels')
  })
})

describe('useFilterActions', () => {
  it('should throw error when used outside FilterProvider', () => {
    expect(() => {
      renderHook(() => useFilterActions())
    }).toThrow('useFilterActions must be used within FilterProvider')
  })

  describe('toggleFilter', () => {
    it('should toggle filter visibility', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      expect(result.current.filter.isVisible).toBe(false)

      act(() => {
        result.current.actions.toggleFilter()
      })

      expect(result.current.filter.isVisible).toBe(true)

      act(() => {
        result.current.actions.toggleFilter()
      })

      expect(result.current.filter.isVisible).toBe(false)
    })
  })

  describe('closeFilter', () => {
    it('should close the filter', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      // Open first
      act(() => {
        result.current.actions.toggleFilter()
      })
      expect(result.current.filter.isVisible).toBe(true)

      // Close
      act(() => {
        result.current.actions.closeFilter()
      })

      expect(result.current.filter.isVisible).toBe(false)
    })
  })

  describe('filterAppendChar', () => {
    it('should append character to search query', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      act(() => {
        result.current.actions.filterAppendChar('h')
        result.current.actions.filterAppendChar('e')
        result.current.actions.filterAppendChar('l')
        result.current.actions.filterAppendChar('l')
        result.current.actions.filterAppendChar('o')
      })

      expect(result.current.filter.searchQuery).toBe('hello')
    })
  })

  describe('filterDeleteChar', () => {
    it('should delete last character from search query', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      act(() => {
        result.current.actions.filterAppendChar('t')
        result.current.actions.filterAppendChar('e')
        result.current.actions.filterAppendChar('s')
        result.current.actions.filterAppendChar('t')
      })
      expect(result.current.filter.searchQuery).toBe('test')

      act(() => {
        result.current.actions.filterDeleteChar()
      })
      expect(result.current.filter.searchQuery).toBe('tes')
    })

    it('should handle empty search query gracefully', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      expect(result.current.filter.searchQuery).toBe('')

      act(() => {
        result.current.actions.filterDeleteChar()
      })

      expect(result.current.filter.searchQuery).toBe('')
    })
  })

  describe('filterToggleLevel', () => {
    it('should toggle level out of enabled set', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      expect(result.current.filter.enabledLevels.has('log')).toBe(true)

      const logIndex = ALL_LOG_LEVELS.indexOf('log')
      act(() => {
        result.current.actions.filterToggleLevel(logIndex)
      })

      expect(result.current.filter.enabledLevels.has('log')).toBe(false)
    })

    it('should toggle level back into enabled set', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      const logIndex = ALL_LOG_LEVELS.indexOf('log')

      act(() => {
        result.current.actions.filterToggleLevel(logIndex)
      })
      expect(result.current.filter.enabledLevels.has('log')).toBe(false)

      act(() => {
        result.current.actions.filterToggleLevel(logIndex)
      })
      expect(result.current.filter.enabledLevels.has('log')).toBe(true)
    })
  })

  describe('filterCycleField', () => {
    it('should cycle between search and levels', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      expect(result.current.filter.focusedField).toBe('search')

      act(() => {
        result.current.actions.filterCycleField()
      })
      expect(result.current.filter.focusedField).toBe('levels')

      act(() => {
        result.current.actions.filterCycleField()
      })
      expect(result.current.filter.focusedField).toBe('search')
    })
  })
})
