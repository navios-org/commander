import { describe, it, expect } from 'bun:test'
import { renderHook, act } from '@testing-library/react'

import { ALL_LOG_LEVELS } from '@navios/commander-tui'
import { useFilterState } from '../../hooks/use_filter_state.ts'

// Import setup to apply mocks
import '../setup.ts'

describe('useFilterState', () => {
  describe('initial state', () => {
    it('should return default filter state', () => {
      const { result } = renderHook(() => useFilterState())
      const [filter] = result.current

      expect(filter.isVisible).toBe(false)
      expect(filter.searchQuery).toBe('')
      expect(filter.focusedField).toBe('search')
      expect(filter.enabledLevels.size).toBe(ALL_LOG_LEVELS.length)
    })

    it('should have all log levels enabled by default', () => {
      const { result } = renderHook(() => useFilterState())
      const [filter] = result.current

      for (const level of ALL_LOG_LEVELS) {
        expect(filter.enabledLevels.has(level)).toBe(true)
      }
    })

    it('should return filter actions', () => {
      const { result } = renderHook(() => useFilterState())
      const [, actions] = result.current

      expect(typeof actions.toggleFilter).toBe('function')
      expect(typeof actions.closeFilter).toBe('function')
      expect(typeof actions.filterAppendChar).toBe('function')
      expect(typeof actions.filterDeleteChar).toBe('function')
      expect(typeof actions.filterToggleLevel).toBe('function')
      expect(typeof actions.filterCycleField).toBe('function')
    })
  })

  describe('toggleFilter', () => {
    it('should toggle filter visibility from false to true', () => {
      const { result } = renderHook(() => useFilterState())

      expect(result.current[0].isVisible).toBe(false)

      act(() => {
        result.current[1].toggleFilter()
      })

      expect(result.current[0].isVisible).toBe(true)
    })

    it('should toggle filter visibility from true to false', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current[1].toggleFilter()
      })
      expect(result.current[0].isVisible).toBe(true)

      act(() => {
        result.current[1].toggleFilter()
      })
      expect(result.current[0].isVisible).toBe(false)
    })

    it('should reset focusedField to search when toggling', () => {
      const { result } = renderHook(() => useFilterState())

      // First change the focused field
      act(() => {
        result.current[1].filterCycleField()
      })
      expect(result.current[0].focusedField).toBe('levels')

      // Toggle filter should reset to search
      act(() => {
        result.current[1].toggleFilter()
      })
      expect(result.current[0].focusedField).toBe('search')
    })
  })

  describe('closeFilter', () => {
    it('should close the filter when open', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current[1].toggleFilter()
      })
      expect(result.current[0].isVisible).toBe(true)

      act(() => {
        result.current[1].closeFilter()
      })
      expect(result.current[0].isVisible).toBe(false)
    })

    it('should do nothing when filter is already closed', () => {
      const { result } = renderHook(() => useFilterState())

      expect(result.current[0].isVisible).toBe(false)

      act(() => {
        result.current[1].closeFilter()
      })
      expect(result.current[0].isVisible).toBe(false)
    })
  })

  describe('filterAppendChar', () => {
    it('should append a single character to search query', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current[1].filterAppendChar('a')
      })

      expect(result.current[0].searchQuery).toBe('a')
    })

    it('should append multiple characters sequentially', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current[1].filterAppendChar('h')
        result.current[1].filterAppendChar('e')
        result.current[1].filterAppendChar('l')
        result.current[1].filterAppendChar('l')
        result.current[1].filterAppendChar('o')
      })

      expect(result.current[0].searchQuery).toBe('hello')
    })

    it('should handle special characters', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current[1].filterAppendChar('$')
        result.current[1].filterAppendChar('.')
        result.current[1].filterAppendChar('*')
      })

      expect(result.current[0].searchQuery).toBe('$.*')
    })
  })

  describe('filterDeleteChar', () => {
    it('should delete the last character from search query', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current[1].filterAppendChar('t')
        result.current[1].filterAppendChar('e')
        result.current[1].filterAppendChar('s')
        result.current[1].filterAppendChar('t')
      })
      expect(result.current[0].searchQuery).toBe('test')

      act(() => {
        result.current[1].filterDeleteChar()
      })
      expect(result.current[0].searchQuery).toBe('tes')
    })

    it('should handle multiple deletes', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current[1].filterAppendChar('a')
        result.current[1].filterAppendChar('b')
        result.current[1].filterAppendChar('c')
      })

      act(() => {
        result.current[1].filterDeleteChar()
        result.current[1].filterDeleteChar()
      })

      expect(result.current[0].searchQuery).toBe('a')
    })

    it('should handle delete on empty query gracefully', () => {
      const { result } = renderHook(() => useFilterState())

      expect(result.current[0].searchQuery).toBe('')

      act(() => {
        result.current[1].filterDeleteChar()
      })

      expect(result.current[0].searchQuery).toBe('')
    })
  })

  describe('filterToggleLevel', () => {
    it('should toggle a level on and off', () => {
      const { result } = renderHook(() => useFilterState())
      const logIndex = ALL_LOG_LEVELS.indexOf('log')

      expect(result.current[0].enabledLevels.has('log')).toBe(true)

      act(() => {
        result.current[1].filterToggleLevel(logIndex)
      })
      expect(result.current[0].enabledLevels.has('log')).toBe(false)

      act(() => {
        result.current[1].filterToggleLevel(logIndex)
      })
      expect(result.current[0].enabledLevels.has('log')).toBe(true)
    })

    it('should handle toggling multiple levels', () => {
      const { result } = renderHook(() => useFilterState())
      const errorIndex = ALL_LOG_LEVELS.indexOf('error')
      const warnIndex = ALL_LOG_LEVELS.indexOf('warn')

      act(() => {
        result.current[1].filterToggleLevel(errorIndex)
        result.current[1].filterToggleLevel(warnIndex)
      })

      expect(result.current[0].enabledLevels.has('error')).toBe(false)
      expect(result.current[0].enabledLevels.has('warn')).toBe(false)
      expect(result.current[0].enabledLevels.has('log')).toBe(true)
    })

    it('should handle out-of-bounds indices gracefully', () => {
      const { result } = renderHook(() => useFilterState())
      const initialSize = result.current[0].enabledLevels.size

      act(() => {
        result.current[1].filterToggleLevel(999)
        result.current[1].filterToggleLevel(-1)
      })

      expect(result.current[0].enabledLevels.size).toBe(initialSize)
    })
  })

  describe('filterCycleField', () => {
    it('should cycle between search and levels', () => {
      const { result } = renderHook(() => useFilterState())

      expect(result.current[0].focusedField).toBe('search')

      act(() => {
        result.current[1].filterCycleField()
      })
      expect(result.current[0].focusedField).toBe('levels')

      act(() => {
        result.current[1].filterCycleField()
      })
      expect(result.current[0].focusedField).toBe('search')
    })
  })

  describe('action stability', () => {
    it('should return stable action references', () => {
      const { result, rerender } = renderHook(() => useFilterState())

      const firstActions = result.current[1]
      rerender()
      const secondActions = result.current[1]

      // useCallback should keep the same function references
      expect(firstActions.toggleFilter).toBe(secondActions.toggleFilter)
      expect(firstActions.closeFilter).toBe(secondActions.closeFilter)
      expect(firstActions.filterAppendChar).toBe(secondActions.filterAppendChar)
      expect(firstActions.filterDeleteChar).toBe(secondActions.filterDeleteChar)
      expect(firstActions.filterToggleLevel).toBe(secondActions.filterToggleLevel)
      expect(firstActions.filterCycleField).toBe(secondActions.filterCycleField)
    })
  })
})
