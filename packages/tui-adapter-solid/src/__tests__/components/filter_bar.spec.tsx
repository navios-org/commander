import { describe, it, expect } from 'bun:test'

import { FilterBar } from '../../components/filter/filter_bar.tsx'
import { createFilterState } from '../mocks/factories.ts'

import type { LevelCounts } from '@navios/commander-tui'

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
 * FilterBar component tests for Solid.js adapter
 *
 * Due to Solid.js + OpenTUI requiring a renderer context for JSX execution,
 * these tests verify component existence and filter/level count factory functionality.
 * Full rendering tests would require a mock renderer context setup.
 */
describe('FilterBar', () => {
  it('should be a valid Solid component function', () => {
    expect(typeof FilterBar).toBe('function')
    expect(FilterBar.name).toBe('FilterBar')
  })

  describe('filter state factory', () => {
    it('should create filter state with default values', () => {
      const filter = createFilterState()
      expect(filter.isVisible).toBe(false)
      expect(filter.searchQuery).toBe('')
      expect(filter.focusedField).toBe('search')
    })

    it('should create filter state with custom values', () => {
      const enabledLevels = new Set(['error', 'fatal'] as const)
      const filter = createFilterState({
        isVisible: true,
        searchQuery: 'error',
        focusedField: 'levels',
        enabledLevels: enabledLevels as Set<any>,
      })
      expect(filter.isVisible).toBe(true)
      expect(filter.searchQuery).toBe('error')
      expect(filter.focusedField).toBe('levels')
      expect(filter.enabledLevels.has('error')).toBe(true)
      expect(filter.enabledLevels.has('log')).toBe(false)
    })

    it('should have all levels enabled by default', () => {
      const filter = createFilterState()
      const levels = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'] as const
      for (const level of levels) {
        expect(filter.enabledLevels.has(level)).toBe(true)
      }
    })
  })

  describe('level counts factory', () => {
    it('should create level counts with default zero values', () => {
      const counts = createLevelCounts()
      expect(counts.verbose).toBe(0)
      expect(counts.debug).toBe(0)
      expect(counts.log).toBe(0)
      expect(counts.warn).toBe(0)
      expect(counts.error).toBe(0)
      expect(counts.fatal).toBe(0)
    })

    it('should create level counts with custom values', () => {
      const counts = createLevelCounts({
        log: 10,
        warn: 5,
        error: 150,
      })
      expect(counts.log).toBe(10)
      expect(counts.warn).toBe(5)
      expect(counts.error).toBe(150)
    })
  })
})
