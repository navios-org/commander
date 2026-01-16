import { ALL_LOG_LEVELS } from '@navios/commander-tui'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import { describe, it, expect } from 'vitest'

import {
  FilterProvider,
  useFilter,
  useFilterActions,
} from '../../components/content/filter_context.tsx'

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

    it('should set focusedField to search when opening', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      // First change to levels
      act(() => {
        result.current.actions.filterCycleField()
      })
      expect(result.current.filter.focusedField).toBe('levels')

      // Open filter - should reset to search
      act(() => {
        result.current.actions.toggleFilter()
      })

      expect(result.current.filter.focusedField).toBe('search')
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

    it('should be idempotent when already closed', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      expect(result.current.filter.isVisible).toBe(false)

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
      })
      expect(result.current.filter.searchQuery).toBe('h')

      act(() => {
        result.current.actions.filterAppendChar('e')
      })
      expect(result.current.filter.searchQuery).toBe('he')

      act(() => {
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

      // Build up query
      act(() => {
        result.current.actions.filterAppendChar('t')
        result.current.actions.filterAppendChar('e')
        result.current.actions.filterAppendChar('s')
        result.current.actions.filterAppendChar('t')
      })
      expect(result.current.filter.searchQuery).toBe('test')

      // Delete characters
      act(() => {
        result.current.actions.filterDeleteChar()
      })
      expect(result.current.filter.searchQuery).toBe('tes')

      act(() => {
        result.current.actions.filterDeleteChar()
      })
      expect(result.current.filter.searchQuery).toBe('te')
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

      // All levels start enabled
      expect(result.current.filter.enabledLevels.has('log')).toBe(true)

      // Toggle 'log' off (index 2 in ALL_LOG_LEVELS = ['verbose', 'debug', 'log', ...])
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

      // Toggle off
      act(() => {
        result.current.actions.filterToggleLevel(logIndex)
      })
      expect(result.current.filter.enabledLevels.has('log')).toBe(false)

      // Toggle back on
      act(() => {
        result.current.actions.filterToggleLevel(logIndex)
      })
      expect(result.current.filter.enabledLevels.has('log')).toBe(true)
    })

    it('should handle invalid index gracefully', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      const initialSize = result.current.filter.enabledLevels.size

      act(() => {
        result.current.actions.filterToggleLevel(999)
      })

      expect(result.current.filter.enabledLevels.size).toBe(initialSize)
    })

    it('should handle negative index gracefully', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      const initialSize = result.current.filter.enabledLevels.size

      act(() => {
        result.current.actions.filterToggleLevel(-1)
      })

      expect(result.current.filter.enabledLevels.size).toBe(initialSize)
    })
  })

  describe('filterCycleField', () => {
    it('should cycle from search to levels', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      expect(result.current.filter.focusedField).toBe('search')

      act(() => {
        result.current.actions.filterCycleField()
      })

      expect(result.current.filter.focusedField).toBe('levels')
    })

    it('should cycle from levels to search', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      // First cycle to levels
      act(() => {
        result.current.actions.filterCycleField()
      })
      expect(result.current.filter.focusedField).toBe('levels')

      // Then cycle back to search
      act(() => {
        result.current.actions.filterCycleField()
      })

      expect(result.current.filter.focusedField).toBe('search')
    })

    it('should cycle continuously', () => {
      const { result } = renderFilterHook(() => ({
        filter: useFilter(),
        actions: useFilterActions(),
      }))

      act(() => {
        result.current.actions.filterCycleField() // -> levels
        result.current.actions.filterCycleField() // -> search
        result.current.actions.filterCycleField() // -> levels
      })

      expect(result.current.filter.focusedField).toBe('levels')
    })
  })
})
