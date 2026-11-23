import { TestContainer } from '@navios/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Registers the @Injectable ScreenManager service with the DI registry
import '../../services/screen_manager.ts'
import { Adapter } from '../../tokens/adapter.ts'
import { ScreenManager } from '../../tokens/screen-manager.ts'
import { RenderMode } from '../../types/index.ts'
import { dynamicImport } from '../../utils/index.ts'
import { createLogMessage } from '../utils/factories.ts'

import type { AdapterInterface } from '../../adapters/interface.ts'
import type { ScreenManagerInstance } from '../../services/screen_manager.ts'

// The renderer is loaded via dynamicImport('@opentui/core'), which bypasses vi.mock
vi.mock('../../utils/index.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/index.ts')>()),
  dynamicImport: vi.fn(),
}))

function setTTY(value: boolean | undefined) {
  Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true })
  Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true })
}

describe('ScreenManager teardown with OpenTUI renderer', () => {
  let container: TestContainer
  let manager: ScreenManagerInstance
  const originalStdoutTTY = process.stdout.isTTY
  const originalStdinTTY = process.stdin.isTTY

  beforeEach(async () => {
    setTTY(true)
    container = new TestContainer()
    const fakeAdapter: AdapterInterface = {
      createRoot: () => ({ render: vi.fn(), unmount: vi.fn() }),
      renderToRoot: vi.fn(),
    }
    container.bind(Adapter).toValue(fakeAdapter)
    manager = await container.get(ScreenManager)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    Object.defineProperty(process.stdout, 'isTTY', { value: originalStdoutTTY, configurable: true })
    Object.defineProperty(process.stdin, 'isTTY', { value: originalStdinTTY, configurable: true })
    await container.dispose()
  })

  it('unbind waits for renderer.closed before flushing screens', async () => {
    let resolveClosed!: () => void
    const renderer = {
      destroy: vi.fn(),
      closed: new Promise<void>((resolve) => {
        resolveClosed = resolve
      }),
    }
    vi.mocked(dynamicImport).mockResolvedValue({ createCliRenderer: async () => renderer })

    await manager.bind({ useOpenTUI: true })
    expect(manager.getRenderMode()).toBe(RenderMode.TUI_ACTIVE)

    const screen = manager.createScreen({ name: 'Main' })
    screen.addMessage(createLogMessage({ content: 'flushed on exit' }))

    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    const unbinding = manager.unbind()
    // Let unbind run as far as it can before the terminal is restored
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(renderer.destroy).toHaveBeenCalledOnce()
    expect(write).not.toHaveBeenCalled()

    resolveClosed()
    await unbinding

    const output = write.mock.calls.map(([chunk]) => String(chunk)).join('')
    expect(output).toContain('flushed on exit')
  })

  it('unbind still flushes screens when renderer.closed rejects', async () => {
    // OpenTUI rejects `closed` on sink errors or a late/timed-out graceful close
    const renderer = {
      destroy: vi.fn(),
      closed: Promise.reject(new Error('graceful close timed out')),
    }
    renderer.closed.catch(() => {}) // avoid an unhandled rejection before unbind awaits it
    vi.mocked(dynamicImport).mockResolvedValue({ createCliRenderer: async () => renderer })

    await manager.bind({ useOpenTUI: true })
    const screen = manager.createScreen({ name: 'Main' })
    screen.addMessage(createLogMessage({ content: 'kept despite close failure' }))
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await expect(manager.unbind()).resolves.toBeUndefined()

    const output = write.mock.calls.map(([chunk]) => String(chunk)).join('')
    expect(output).toContain('kept despite close failure')
    expect(manager.getRenderMode()).toBe(RenderMode.UNBOUND)
  })
})
