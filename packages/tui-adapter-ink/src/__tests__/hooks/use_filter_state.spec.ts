import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'

import { useFilterState } from '../../hooks/use_filter_state.ts'
import { FilterProvider, useFilter, useFilterActions } from '../../components/content/filter_context.tsx'

// Helper to render hooks within FilterProvider
function renderFilterHook<T>(hook: () => T) {
  return renderHook(hook, {
    wrapper: ({ children }) => createElement(FilterProvider, null, children),
  })
}

describe('useFilterState', () => {
  describe('initial state', () => {
    it('should return default filter state', () => {
      const { result } = renderFilterHook(() => useFilter())

      expect(result.current.isVisible).toBe(false)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.focusedField).toBe('search')
      expect(result.current.enabledLevels).toBeDefined()
      expect(result.current.enabledLevels.size).toBeGreaterThan(0)
    })
  })

  describe('useFilterActions', () => {
    describe('toggleFilter', () => {
      it('should toggle filter visibility', () => {
        const { result: filterResult } = renderFilterHook(() => useFilter())
        const { result: actionsResult } = renderFilterHook(() => useFilterActions())

        expect(filterResult.current.isVisible).toBe(false)

        act(() => {
          actionsResult.current.toggleFilter()
        })

        // Re-render to get updated state - need to use same context
        const { result } = renderFilterHook(() => ({
          filter: useFilter(),
          actions: useFilterActions(),
        }))

        act(() => {
          result.current.actions.toggleFilter()
        })

        expect(result.current.filter.isVisible).toBe(true)
      })

      it('should set focusedField to search when opening', () => {
        const { result } = renderFilterHook(() => ({
          filter: useFilter(),
          actions: useFilterActions(),
        }))

        act(() => {
          result.current.actions.toggleFilter()
        })

        expect(result.current.filter.isVisible).toBe(true)
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

        // Then close
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
          result.current.actions.filterAppendChar('a')
        })

        expect(result.current.filter.searchQuery).toBe('a')

        act(() => {
          result.current.actions.filterAppendChar('b')
        })

        expect(result.current.filter.searchQuery).toBe('ab')
      })
    })

    describe('filterDeleteChar', () => {
      it('should delete last character from search query', () => {
        const { result } = renderFilterHook(() => ({
          filter: useFilter(),
          actions: useFilterActions(),
        }))

        act(() => {
          result.current.actions.filterAppendChar('a')
          result.current.actions.filterAppendChar('b')
          result.current.actions.filterAppendChar('c')
        })

        expect(result.current.filter.searchQuery).toBe('abc')

        act(() => {
          result.current.actions.filterDeleteChar()
        })

        expect(result.current.filter.searchQuery).toBe('ab')
      })

      it('should handle empty search query', () => {
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
      // ALL_LOG_LEVELS = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']
      // So 'log' is at index 2
      const LOG_LEVEL_INDEX = 2

      it('should toggle log level in/out of enabled set', () => {
        const { result } = renderFilterHook(() => ({
          filter: useFilter(),
          actions: useFilterActions(),
        }))

        const initialHasLog = result.current.filter.enabledLevels.has('log')

        act(() => {
          result.current.actions.filterToggleLevel(LOG_LEVEL_INDEX)
        })

        expect(result.current.filter.enabledLevels.has('log')).toBe(!initialHasLog)

        act(() => {
          result.current.actions.filterToggleLevel(LOG_LEVEL_INDEX)
        })

        expect(result.current.filter.enabledLevels.has('log')).toBe(initialHasLog)
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
})

describe('useFilter outside FilterProvider', () => {
  it('should throw error when used outside FilterProvider', () => {
    expect(() => {
      renderHook(() => useFilter())
    }).toThrow()
  })
})

describe('useFilterActions outside FilterProvider', () => {
  it('should throw error when used outside FilterProvider', () => {
    expect(() => {
      renderHook(() => useFilterActions())
    }).toThrow()
  })
})
