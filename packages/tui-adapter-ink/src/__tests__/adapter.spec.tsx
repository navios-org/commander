import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ScreenManagerBridge } from '../components/screen_manager_bridge.tsx'
import { withFullScreen } from '../fullscreen/index.ts'
import { inkAdapter } from '../index.ts'

import { createMockScreenManagerInstance, asMockManager } from './mocks/factories.ts'

vi.mock('../fullscreen/index.ts', () => ({ withFullScreen: vi.fn() }))

function fakeInk() {
  let exit!: () => void
  const exited = new Promise<void>((resolve) => {
    exit = resolve
  })
  const ink = {
    instance: { rerender: vi.fn(), unmount: vi.fn(() => exit()) },
    start: vi.fn(async () => {}),
    waitUntilExit: vi.fn(() => exited),
  }
  vi.mocked(withFullScreen).mockReturnValue(ink as never)
  return { ink, exit }
}

describe('inkAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the bridge in fullscreen with the manager, the theme and the Ctrl+C option', async () => {
    const { ink } = fakeInk()
    const manager = asMockManager(createMockScreenManagerInstance())
    const theme = { name: 'custom' } as never

    await inkAdapter().mount({ manager, theme, options: { exitOnCtrlC: false } })

    expect(withFullScreen).toHaveBeenCalledWith(
      <ScreenManagerBridge manager={manager} theme={theme} />,
      {
        exitOnCtrlC: false,
      },
    )
    expect(ink.start).toHaveBeenCalledTimes(1)
  })

  it('exits on Ctrl+C unless told otherwise', async () => {
    fakeInk()
    await inkAdapter().mount({
      manager: asMockManager(createMockScreenManagerInstance()),
      options: {},
    })
    expect(vi.mocked(withFullScreen).mock.calls[0][1]).toEqual({ exitOnCtrlC: true })
  })

  it('unmounts Ink once and waits until the terminal is given back', async () => {
    const { ink } = fakeInk()
    const mount = await inkAdapter().mount({
      manager: asMockManager(createMockScreenManagerInstance()),
      options: {},
    })

    await mount.unmount()
    await mount.unmount()

    expect(ink.instance.unmount).toHaveBeenCalledTimes(1)
    expect(ink.waitUntilExit).toHaveBeenCalled()
  })

  it('tells the manager when Ink exits by itself', async () => {
    const { exit } = fakeInk()
    const mockManager = createMockScreenManagerInstance()
    const unbind = vi.fn(async () => {})
    Object.assign(mockManager, { unbind })
    await inkAdapter().mount({ manager: asMockManager(mockManager), options: {} })

    exit() // Ctrl+C
    await new Promise((resolve) => setImmediate(resolve))

    expect(unbind).toHaveBeenCalledTimes(1)
  })
})
