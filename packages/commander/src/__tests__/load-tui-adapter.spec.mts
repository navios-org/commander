import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadTuiAdapter } from '../utils/load-tui-adapter.mjs'
import { dynamicImport } from '../utils/runtime.mjs'

import type { TuiRuntimeProbe } from '../utils/load-tui-adapter.mjs'

vi.mock('../utils/runtime.mjs', () => ({
  dynamicImport: vi.fn(async () => ({})),
}))

const onNode = (openTUISupported: boolean): TuiRuntimeProbe => ({
  isBunRuntime: () => false,
  isOpenTUISupported: async () => openTUISupported,
})

describe('loadTuiAdapter', () => {
  beforeEach(() => {
    vi.mocked(dynamicImport).mockClear()
  })

  it.each(['react', 'solid'] as const)(
    'loads the %s adapter on Node.js when OpenTUI is supported there',
    async (adapter) => {
      await loadTuiAdapter(onNode(true), adapter)

      expect(dynamicImport).toHaveBeenCalledWith(`@navios/tui-adapter-${adapter}`)
    },
  )

  it.each(['react', 'solid'] as const)(
    'skips the %s adapter when the runtime cannot run OpenTUI',
    async (adapter) => {
      await loadTuiAdapter(onNode(false), adapter)

      expect(dynamicImport).not.toHaveBeenCalled()
    },
  )

  it('always loads the ink adapter', async () => {
    await loadTuiAdapter(onNode(false), 'ink')

    expect(dynamicImport).toHaveBeenCalledWith('@navios/tui-adapter-ink')
  })

  it('keeps the Bun-only rule with commander-tui versions that lack isOpenTUISupported', async () => {
    await loadTuiAdapter({ isBunRuntime: () => false }, 'react')
    expect(dynamicImport).not.toHaveBeenCalled()

    await loadTuiAdapter({ isBunRuntime: () => true }, 'react')
    expect(dynamicImport).toHaveBeenCalledWith('@navios/tui-adapter-react')
  })
})
