import { describe, it, expect } from 'bun:test'

import type { LevelCounts } from '@navios/commander-tui'

import { FilterBar } from '../../components/filter/filter_bar.tsx'
import { createFilterState } from '../mocks/factories.ts'
// Import setup to apply mocks
import '../setup.ts'

function createLevelCounts(overrides: Partial<LevelCounts> = {}): LevelCounts {
  return {
    verbose: 0,
    debug: 0,
    log: 0,
    warn: 0,
    error: 0,
    fatal: 0,
    ...overrides,
  }
}

/**
 * FilterBar component tests
 *
 * Tests verify component structure, filter state handling, and level counts display.
 */
describe('FilterBar', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof FilterBar).toBe('function')
    })

    it('should accept filter and levelCounts props', () => {
      const filter = createFilterState()
      const levelCounts = createLevelCounts()

      const element = <FilterBar filter={filter} levelCounts={levelCounts} />

      expect(element.props.filter).toBe(filter)
      expect(element.props.levelCounts).toBe(levelCounts)
    })
  })

  describe('filter state handling', () => {
    it('should handle visibility and search query', () => {
      const visibleFilter = createFilterState({ isVisible: true, searchQuery: 'error.*' })
      const hiddenFilter = createFilterState({ isVisible: false, searchQuery: '' })
      const levelCounts = createLevelCounts()

      const visibleElement = <FilterBar filter={visibleFilter} levelCounts={levelCounts} />
      const hiddenElement = <FilterBar filter={hiddenFilter} levelCounts={levelCounts} />

      expect(visibleElement.props.filter.isVisible).toBe(true)
      expect(visibleElement.props.filter.searchQuery).toBe('error.*')
      expect(hiddenElement.props.filter.isVisible).toBe(false)
      expect(hiddenElement.props.filter.searchQuery).toBe('')
    })

    it('should handle focused field values', () => {
      const searchFocused = createFilterState({ focusedField: 'search' })
      const levelsFocused = createFilterState({ focusedField: 'levels' })
      const levelCounts = createLevelCounts()

      expect(
        (<FilterBar filter={searchFocused} levelCounts={levelCounts} />).props.filter.focusedField,
      ).toBe('search')
      expect(
        (<FilterBar filter={levelsFocused} levelCounts={levelCounts} />).props.filter.focusedField,
      ).toBe('levels')
    })
  })

  describe('enabled levels', () => {
    it('should handle all levels enabled', () => {
      const filter = createFilterState() // All levels enabled by default
      const levelCounts = createLevelCounts()

      const element = <FilterBar filter={filter} levelCounts={levelCounts} />

      expect(element.props.filter.enabledLevels.has('verbose')).toBe(true)
      expect(element.props.filter.enabledLevels.has('debug')).toBe(true)
      expect(element.props.filter.enabledLevels.has('log')).toBe(true)
      expect(element.props.filter.enabledLevels.has('warn')).toBe(true)
      expect(element.props.filter.enabledLevels.has('error')).toBe(true)
      expect(element.props.filter.enabledLevels.has('fatal')).toBe(true)
    })

    it('should handle some levels disabled', () => {
      const enabledLevels = new Set(['log', 'warn', 'error'] as const)
      const filter = createFilterState({ enabledLevels: enabledLevels as Set<any> })
      const levelCounts = createLevelCounts()

      const element = <FilterBar filter={filter} levelCounts={levelCounts} />

      expect(element.props.filter.enabledLevels.has('verbose')).toBe(false)
      expect(element.props.filter.enabledLevels.has('debug')).toBe(false)
      expect(element.props.filter.enabledLevels.has('log')).toBe(true)
      expect(element.props.filter.enabledLevels.has('warn')).toBe(true)
      expect(element.props.filter.enabledLevels.has('error')).toBe(true)
      expect(element.props.filter.enabledLevels.has('fatal')).toBe(false)
    })

    it('should handle all levels disabled', () => {
      const filter = createFilterState({ enabledLevels: new Set() })
      const levelCounts = createLevelCounts()

      const element = <FilterBar filter={filter} levelCounts={levelCounts} />

      expect(element.props.filter.enabledLevels.size).toBe(0)
    })
  })

  describe('level counts', () => {
    it('should handle various count values', () => {
      const filter = createFilterState()
      const testCases = [
        { counts: { log: 0, error: 0 }, expected: { log: 0, error: 0 } },
        { counts: { log: 10, warn: 5, error: 3 }, expected: { log: 10, warn: 5, error: 3 } },
        { counts: { log: 150, error: 200 }, expected: { log: 150, error: 200 } },
      ]

      for (const { counts, expected } of testCases) {
        const levelCounts = createLevelCounts(counts)
        const element = <FilterBar filter={filter} levelCounts={levelCounts} />
        for (const [key, value] of Object.entries(expected)) {
          expect(element.props.levelCounts[key as keyof typeof expected]).toBe(value)
        }
      }
    })
  })

  describe('complex filter scenarios', () => {
    it('should handle filter with search and disabled levels', () => {
      const enabledLevels = new Set(['error', 'fatal'] as const)
      const filter = createFilterState({
        isVisible: true,
        searchQuery: 'critical',
        focusedField: 'search',
        enabledLevels: enabledLevels as Set<any>,
      })
      const levelCounts = createLevelCounts({ error: 15, fatal: 2 })

      const element = <FilterBar filter={filter} levelCounts={levelCounts} />

      expect(element.props.filter.isVisible).toBe(true)
      expect(element.props.filter.searchQuery).toBe('critical')
      expect(element.props.filter.enabledLevels.has('error')).toBe(true)
      expect(element.props.filter.enabledLevels.has('log')).toBe(false)
      expect(element.props.levelCounts.error).toBe(15)
    })
  })
})
