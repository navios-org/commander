import { describe, expect, it, vi } from 'vitest'

import { createDefaultBindings, KeyboardManager } from '../../keyboard/index.ts'

import type { KeyboardContext } from '../../types/index.ts'

describe('digits in the filter bar', () => {
  const context = (filterField: 'search' | 'levels'): KeyboardContext => ({
    hasSidebar: true,
    focusArea: 'content',
    hasPrompt: false,
    inInputMode: false,
    isFilterActive: true,
    filterField,
    isHelpVisible: false,
  })

  function setup() {
    const filterToggleLevel = vi.fn()
    const noop = () => {}
    const handlers = new Proxy(
      { filterToggleLevel },
      { get: (target, key) => (key in target ? target[key as 'filterToggleLevel'] : noop) },
    )
    const keyboard = new KeyboardManager({
      bindings: createDefaultBindings(handlers as never),
    })
    return { keyboard, filterToggleLevel }
  }

  it('toggle a level only while the levels have the focus', () => {
    const { keyboard, filterToggleLevel } = setup()
    expect(keyboard.handleKey({ name: '2', sequence: '2' }, context('levels'))).toBe(true)
    expect(filterToggleLevel).toHaveBeenCalledWith(1)

    filterToggleLevel.mockClear()
    // In the search field the digit is left for the search text.
    expect(keyboard.handleKey({ name: '2', sequence: '2' }, context('search'))).toBe(false)
    expect(filterToggleLevel).not.toHaveBeenCalled()
  })

  it('have no binding beyond the number of levels', () => {
    const { keyboard, filterToggleLevel } = setup()
    keyboard.handleKey({ name: '7', sequence: '7' }, context('levels'))
    expect(filterToggleLevel).not.toHaveBeenCalled()
  })
})
