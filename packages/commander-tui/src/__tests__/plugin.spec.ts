import { createApplication, inject, Injectable, Logger, Module } from '@navios/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RenderMode, ScreenManager, tui } from '../index.ts'

import type { TuiAdapter } from '../index.ts'

function setTTY(value: boolean) {
  Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true })
  Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true })
}

@Injectable()
class Worker {
  private readonly logger = inject(Logger, { context: 'Worker' })

  work() {
    this.logger.log('working')
    this.logger.error('failed', 'stack line')
  }
}

@Module({})
class AppModule {}

describe('tui plugin', () => {
  const stdoutTTY = process.stdout.isTTY
  const stdinTTY = process.stdin.isTTY

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(process.stdout, 'isTTY', { value: stdoutTTY, configurable: true })
    Object.defineProperty(process.stdin, 'isTTY', { value: stdinTTY, configurable: true })
  })

  it('mounts the adapter when the application starts and unmounts it when it closes', async () => {
    setTTY(true)
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const unmount = vi.fn()
    const adapter: TuiAdapter = { name: 'fake', mount: vi.fn(() => ({ unmount })) }
    const app = createApplication(AppModule, {
      plugins: [tui({ adapter, sidebar: { title: 'Demo' }, theme: 'light' })],
    })

    await app.start()
    const manager = await app.container.get(ScreenManager)
    expect(manager.getRenderMode()).toBe(RenderMode.TUI_ACTIVE)
    expect(adapter.mount).toHaveBeenCalledWith(
      expect.objectContaining({
        manager,
        options: { sidebar: { title: 'Demo' }, theme: 'light' },
      }),
    )

    await app.close()
    expect(unmount).toHaveBeenCalledTimes(1)
  })

  it('sends the log of the application to a screen, with its context', async () => {
    setTTY(true)
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const app = createApplication(AppModule, {
      plugins: [
        tui({
          adapter: { name: 'fake', mount: () => ({ unmount() {} }) },
          logScreen: { name: 'App log', hidden: true },
        }),
      ],
    })
    await app.start()
    const manager = await app.container.get(ScreenManager)
    const screen = manager.getScreenByName('App log')!
    expect(screen.isHidden()).toBe(true)

    ;(await app.container.get(Worker)).work()

    const logged = screen.getMessages().filter((message) => message.type === 'log')
    expect(logged.slice(-2)).toEqual([
      expect.objectContaining({ level: 'log', content: 'working', label: 'Worker' }),
      expect.objectContaining({ level: 'error', content: 'failed stack line', label: 'Worker' }),
    ])
    // An error is never left on a screen nobody sees.
    expect(screen.isHidden()).toBe(false)
    await app.close()
  })

  it('prints to standard output where there is no terminal', async () => {
    setTTY(false)
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const mount = vi.fn()
    const app = createApplication(AppModule, {
      logger: ['log', 'error'],
      plugins: [tui({ adapter: { name: 'fake', mount } })],
    })
    await app.start()
    ;(await app.container.get(Worker)).work()
    await app.close()

    expect(mount).not.toHaveBeenCalled()
    const printed = write.mock.calls.map(([text]) => String(text)).join('')
    expect(printed).toContain('[Worker] working')
    expect(printed).not.toContain('\x1b[')
  })
})
