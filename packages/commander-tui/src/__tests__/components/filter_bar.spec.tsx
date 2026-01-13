import { describe, expect, it } from 'vitest'

import { FilterBar } from '../../adapters/react/components/filter/filter_bar.tsx'
import { createFilterState } from '../utils/factories.ts'
import { wrapWithContext } from '../utils/render-utils.tsx'

import type { LevelCounts } from '../../types/index.ts'

const defaultLevelCounts: LevelCounts = {
  verbose: 0,
  debug: 0,
  log: 0,
  warn: 0,
  error: 0,
  fatal: 0,
}

describe('FilterBar', () => {
  describe('search input', () => {
    it('should render search input', () => {
      const filter = createFilterState({
        searchQuery: '',
        focusedField: 'search',
      })

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with active search query', () => {
      const filter = createFilterState({
        searchQuery: 'error message',
        focusedField: 'search',
      })

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render search focused state', () => {
      const filter = createFilterState({
        focusedField: 'search',
      })

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render levels focused state', () => {
      const filter = createFilterState({
        focusedField: 'levels',
      })

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('log level toggles', () => {
    it('should render log level toggles', () => {
      const filter = createFilterState()

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with some levels disabled', () => {
      const filter = createFilterState({
        enabledLevels: new Set(['error', 'fatal', 'warn']),
      })

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with all levels enabled', () => {
      const filter = createFilterState({
        enabledLevels: new Set(['verbose', 'debug', 'log', 'warn', 'error', 'fatal']),
      })

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })

    it('should render with only one level enabled', () => {
      const filter = createFilterState({
        enabledLevels: new Set(['error']),
      })

      const component = wrapWithContext(
        <FilterBar filter={filter} levelCounts={defaultLevelCounts} />,
      )

      expect(component).toMatchSnapshot()
    })
  })

  describe('level counts', () => {
    it('should render level counts', () => {
      const filter = createFilterState()
      const levelCounts: LevelCounts = {
        verbose: 5,
        debug: 12,
        log: 25,
        warn: 3,
        error: 2,
        fatal: 0,
      }

      const component = wrapWithContext(<FilterBar filter={filter} levelCounts={levelCounts} />)

      expect(component).toMatchSnapshot()
    })

    it('should truncate high counts to 99+', () => {
      const filter = createFilterState()
      const levelCounts: LevelCounts = {
        verbose: 0,
        debug: 0,
        log: 150,
        warn: 0,
        error: 200,
        fatal: 0,
      }

      const component = wrapWithContext(<FilterBar filter={filter} levelCounts={levelCounts} />)

      expect(component).toMatchSnapshot()
    })

    it('should not show counts when zero', () => {
      const filter = createFilterState()
      const levelCounts: LevelCounts = {
        verbose: 0,
        debug: 0,
        log: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      }

      const component = wrapWithContext(<FilterBar filter={filter} levelCounts={levelCounts} />)

      expect(component).toMatchSnapshot()
    })
  })

  describe('combined states', () => {
    it('should render with search query and disabled levels', () => {
      const filter = createFilterState({
        searchQuery: 'api',
        enabledLevels: new Set(['log', 'error']),
        focusedField: 'search',
      })
      const levelCounts: LevelCounts = {
        verbose: 2,
        debug: 5,
        log: 10,
        warn: 1,
        error: 3,
        fatal: 0,
      }

      const component = wrapWithContext(<FilterBar filter={filter} levelCounts={levelCounts} />)

      expect(component).toMatchSnapshot()
    })
  })
})
