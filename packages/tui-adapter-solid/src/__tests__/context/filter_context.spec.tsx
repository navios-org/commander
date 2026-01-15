import { describe, it, expect } from 'bun:test'

import { ALL_LOG_LEVELS, createDefaultFilterState } from '@navios/commander-tui'
import { createRoot } from 'solid-js'

import {
  FilterProvider,
  useFilter,
  useFilterActions,
  type FilterActions,
} from '../../components/content/filter_context.js'

describe('FilterProvider', () => {
  describe('initial state', () => {
    it('should provide default filter state', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined

        // Render FilterProvider with a child that captures the context
        const child = () => {
          filterState = useFilter()
          return null
        }

        // Use JSX to render the provider
        ;<FilterProvider>{child()}</FilterProvider>

        // Access the filter state (it's an accessor in Solid)
        const state = filterState!()

        expect(state.isVisible).toBe(false)
        expect(state.searchQuery).toBe('')
        expect(state.focusedField).toBe('search')
        expect(state.enabledLevels.size).toBe(ALL_LOG_LEVELS.length)

        dispose()
      })
    })

    it('should have all log levels enabled by default', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            return null
          })()}
        </FilterProvider>

        const state = filterState!()

        for (const level of ALL_LOG_LEVELS) {
          expect(state.enabledLevels.has(level)).toBe(true)
        }

        dispose()
      })
    })
  })

  describe('filter actions', () => {
    it('should provide all filter actions', () => {
      createRoot((dispose) => {
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        expect(filterActions!.toggleFilter).toBeDefined()
        expect(filterActions!.closeFilter).toBeDefined()
        expect(filterActions!.filterAppendChar).toBeDefined()
        expect(filterActions!.filterDeleteChar).toBeDefined()
        expect(filterActions!.filterToggleLevel).toBeDefined()
        expect(filterActions!.filterCycleField).toBeDefined()

        dispose()
      })
    })
  })
})

describe('useFilter', () => {
  it('should throw error when used outside FilterProvider', () => {
    let error: Error | null = null

    createRoot((dispose) => {
      try {
        useFilter()
      } catch (e) {
        error = e as Error
      }
      dispose()
    })

    expect(error).not.toBeNull()
    expect(error?.message).toBe('useFilter must be used within FilterProvider')
  })
})

describe('useFilterActions', () => {
  it('should throw error when used outside FilterProvider', () => {
    let error: Error | null = null

    createRoot((dispose) => {
      try {
        useFilterActions()
      } catch (e) {
        error = e as Error
      }
      dispose()
    })

    expect(error).not.toBeNull()
    expect(error?.message).toBe('useFilterActions must be used within FilterProvider')
  })

  describe('toggleFilter', () => {
    it('should toggle filter visibility', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        expect(filterState!().isVisible).toBe(false)

        filterActions!.toggleFilter()
        expect(filterState!().isVisible).toBe(true)

        filterActions!.toggleFilter()
        expect(filterState!().isVisible).toBe(false)

        dispose()
      })
    })
  })

  describe('closeFilter', () => {
    it('should close the filter', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        // Open first
        filterActions!.toggleFilter()
        expect(filterState!().isVisible).toBe(true)

        // Close
        filterActions!.closeFilter()
        expect(filterState!().isVisible).toBe(false)

        dispose()
      })
    })
  })

  describe('filterAppendChar', () => {
    it('should append character to search query', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        filterActions!.filterAppendChar('h')
        filterActions!.filterAppendChar('e')
        filterActions!.filterAppendChar('l')
        filterActions!.filterAppendChar('l')
        filterActions!.filterAppendChar('o')

        expect(filterState!().searchQuery).toBe('hello')

        dispose()
      })
    })
  })

  describe('filterDeleteChar', () => {
    it('should delete last character from search query', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        filterActions!.filterAppendChar('t')
        filterActions!.filterAppendChar('e')
        filterActions!.filterAppendChar('s')
        filterActions!.filterAppendChar('t')

        expect(filterState!().searchQuery).toBe('test')

        filterActions!.filterDeleteChar()
        expect(filterState!().searchQuery).toBe('tes')

        dispose()
      })
    })

    it('should handle empty search query gracefully', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        expect(filterState!().searchQuery).toBe('')

        filterActions!.filterDeleteChar()
        expect(filterState!().searchQuery).toBe('')

        dispose()
      })
    })
  })

  describe('filterToggleLevel', () => {
    it('should toggle level out of enabled set', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        expect(filterState!().enabledLevels.has('log')).toBe(true)

        const logIndex = ALL_LOG_LEVELS.indexOf('log')
        filterActions!.filterToggleLevel(logIndex)

        expect(filterState!().enabledLevels.has('log')).toBe(false)

        dispose()
      })
    })

    it('should toggle level back into enabled set', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        const logIndex = ALL_LOG_LEVELS.indexOf('log')

        filterActions!.filterToggleLevel(logIndex)
        expect(filterState!().enabledLevels.has('log')).toBe(false)

        filterActions!.filterToggleLevel(logIndex)
        expect(filterState!().enabledLevels.has('log')).toBe(true)

        dispose()
      })
    })
  })

  describe('filterCycleField', () => {
    it('should cycle between search and levels', () => {
      createRoot((dispose) => {
        let filterState: ReturnType<typeof useFilter> | undefined
        let filterActions: FilterActions | undefined

        ;<FilterProvider>
          {(() => {
            filterState = useFilter()
            filterActions = useFilterActions()
            return null
          })()}
        </FilterProvider>

        expect(filterState!().focusedField).toBe('search')

        filterActions!.filterCycleField()
        expect(filterState!().focusedField).toBe('levels')

        filterActions!.filterCycleField()
        expect(filterState!().focusedField).toBe('search')

        dispose()
      })
    })
  })
})

describe('createDefaultFilterState', () => {
  it('should create default filter state', () => {
    const state = createDefaultFilterState()

    expect(state.isVisible).toBe(false)
    expect(state.searchQuery).toBe('')
    expect(state.focusedField).toBe('search')
    expect(state.enabledLevels).toBeDefined()
    expect(state.enabledLevels.size).toBe(ALL_LOG_LEVELS.length)
  })

  it('should have all log levels enabled', () => {
    const state = createDefaultFilterState()

    for (const level of ALL_LOG_LEVELS) {
      expect(state.enabledLevels.has(level)).toBe(true)
    }
  })
})

describe('ALL_LOG_LEVELS', () => {
  it('should contain all expected log levels', () => {
    expect(ALL_LOG_LEVELS).toContain('verbose')
    expect(ALL_LOG_LEVELS).toContain('debug')
    expect(ALL_LOG_LEVELS).toContain('log')
    expect(ALL_LOG_LEVELS).toContain('warn')
    expect(ALL_LOG_LEVELS).toContain('error')
    expect(ALL_LOG_LEVELS).toContain('fatal')
  })

  it('should have 6 log levels', () => {
    expect(ALL_LOG_LEVELS.length).toBe(6)
  })
})
