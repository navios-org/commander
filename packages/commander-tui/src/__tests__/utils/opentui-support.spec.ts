import { afterEach, describe, expect, it, vi } from 'vitest'

import { isNodeVersionAtLeast, isOpenTUISupported } from '../../utils/opentui-support.ts'
import { dynamicImport, isBunRuntime } from '../../utils/runtime.ts'

vi.mock('../../utils/runtime.ts', () => ({
  isBunRuntime: vi.fn(() => false),
  dynamicImport: vi.fn(),
}))

describe('isNodeVersionAtLeast', () => {
  it.each([
    ['26.4.0', true],
    ['26.4.1', true],
    ['26.10.0', true],
    ['27.0.0', true],
    ['26.3.9', false],
    ['24.22.1', false],
    ['3.0.0', false],
  ])('%s >= 26.4.0 is %s', (version, expected) => {
    expect(isNodeVersionAtLeast(version, '26.4.0')).toBe(expected)
  })
})

describe('isOpenTUISupported', () => {
  afterEach(() => {
    vi.mocked(isBunRuntime).mockReset().mockReturnValue(false)
    vi.mocked(dynamicImport).mockReset()
  })

  it('is true under Bun', async () => {
    vi.mocked(isBunRuntime).mockReturnValue(true)

    expect(await isOpenTUISupported('20.0.0')).toBe(true)
  })

  it('is false on Node.js older than 26.4 without probing node:ffi', async () => {
    expect(await isOpenTUISupported('24.22.1')).toBe(false)
    expect(dynamicImport).not.toHaveBeenCalled()
  })

  it('is false on Node.js 26.4+ when node:ffi is unavailable (no --experimental-ffi)', async () => {
    vi.mocked(dynamicImport).mockRejectedValue(new Error('No such built-in module: node:ffi'))

    expect(await isOpenTUISupported('26.4.0')).toBe(false)
  })

  it('is true on Node.js 26.4+ when node:ffi is available', async () => {
    vi.mocked(dynamicImport).mockResolvedValue({})

    expect(await isOpenTUISupported('26.4.0')).toBe(true)
    expect(dynamicImport).toHaveBeenCalledWith('node:ffi')
  })
})
