import { Container, provide } from '@navios/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Registers the services and the screen factory
import '../../index.ts'
import { Adapter } from '../../tokens/adapter.ts'
import { Prompt } from '../../tokens/prompt.ts'
import { ScreenManager } from '../../tokens/screen-manager.ts'
import { RenderMode } from '../../types/index.ts'
import { createLogMessage } from '../utils/factories.ts'

import type { TuiAdapter } from '../../adapters/interface.ts'
import type { ScreenManagerInstance } from '../../services/screen_manager.ts'

function setTTY(value: boolean | undefined) {
  Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true })
  Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true })
}

describe('ScreenManager binding', () => {
  let container: Container
  const originalStdoutTTY = process.stdout.isTTY
  const originalStdinTTY = process.stdin.isTTY

  async function managerWith(adapter?: TuiAdapter): Promise<ScreenManagerInstance> {
    container = new Container({
      providers: adapter ? [provide(Adapter, { value: adapter })] : [],
    })
    return container.get(ScreenManager)
  }

  beforeEach(() => {
    setTTY(true)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    Object.defineProperty(process.stdout, 'isTTY', { value: originalStdoutTTY, configurable: true })
    Object.defineProperty(process.stdin, 'isTTY', { value: originalStdinTTY, configurable: true })
    await container.dispose()
  })

  it('mounts the adapter once, however often bind() is called', async () => {
    const unmount = vi.fn()
    const mount = vi.fn(async () => ({ unmount }))
    const manager = await managerWith({ name: 'fake', mount })

    await Promise.all([manager.bind({ sidebar: { title: 'T' } }), manager.bind(), manager.bind()])

    expect(mount).toHaveBeenCalledTimes(1)
    expect(mount).toHaveBeenCalledWith({
      manager,
      theme: undefined,
      options: { sidebar: { title: 'T' } },
    })
    expect(manager.getRenderMode()).toBe(RenderMode.TUI_ACTIVE)

    await Promise.all([manager.unbind(), manager.unbind()])
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(manager.getRenderMode()).toBe(RenderMode.UNBOUND)
  })

  it('prints what the interface held only after the adapter gave the terminal back', async () => {
    let finishUnmount!: () => void
    const manager = await managerWith({
      name: 'fake',
      mount: () => ({
        unmount: () =>
          new Promise<void>((resolve) => {
            finishUnmount = resolve
          }),
      }),
    })
    await manager.bind()
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    manager.createScreen({ name: 'Build' }).addMessage(createLogMessage({ content: 'compiled' }))
    expect(write).not.toHaveBeenCalled()

    const unbinding = manager.unbind()
    await new Promise((resolve) => setImmediate(resolve))
    expect(write).not.toHaveBeenCalled()

    finishUnmount()
    await unbinding
    expect(write.mock.calls.map(([text]) => String(text)).join('')).toContain('compiled')
  })

  it('falls back to standard output and says why when the adapter cannot run', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mount = vi.fn()
    const manager = await managerWith({
      name: 'fake',
      isSupported: () => 'it needs Node.js 26.4',
      mount,
    })

    await manager.bind()

    expect(mount).not.toHaveBeenCalled()
    expect(manager.getRenderMode()).toBe(RenderMode.STDOUT_FALLBACK)
    expect(warn).toHaveBeenCalledWith(
      '[commander-tui] The fake adapter could not start: it needs Node.js 26.4. ' +
        'Printing to standard output instead.',
    )
    await manager.unbind()
  })

  it('reports the error of an adapter that fails to mount', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const manager = await managerWith({
      name: 'fake',
      mount: () => {
        throw new Error('no terminal size')
      },
    })
    await manager.bind()
    expect(manager.getRenderMode()).toBe(RenderMode.STDOUT_FALLBACK)
    expect(warn.mock.calls[0][0]).toContain('could not start: no terminal size')
    await manager.unbind()
  })

  it('uses standard output without an adapter, and nothing without a terminal', async () => {
    const manager = await managerWith()
    await manager.bind()
    expect(manager.getRenderMode()).toBe(RenderMode.STDOUT_INTERACTIVE)
    await manager.unbind()

    setTTY(false)
    await manager.bind()
    expect(manager.getRenderMode()).toBe(RenderMode.UNBOUND)
  })

  it('answers open prompts with their defaults when the interface closes', async () => {
    const manager = await managerWith({ name: 'fake', mount: () => ({ unmount() {} }) })
    await manager.bind()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const prompt = await container.get(Prompt, { screen: 'Deploy' })

    const first = prompt.confirm({ question: 'Delete everything?' })
    const second = prompt.input({ question: 'Name?', defaultValue: 'none' })
    await manager.unbind()

    await expect(first).resolves.toBe(false)
    await expect(second).resolves.toBe('none')
  })

  it('starts the timeout of a prompt when it is shown, not when it is queued', async () => {
    vi.useFakeTimers()
    try {
      const manager = await managerWith({ name: 'fake', mount: () => ({ unmount() {} }) })
      await manager.bind()
      const prompt = await container.get(Prompt, { screen: 'Deploy' })
      const screen = manager.getScreenByName('Deploy')!

      const first = prompt.input({ question: 'First?', defaultValue: 'a' })
      let secondAnswer: string | undefined
      void prompt.input({ question: 'Second?', defaultValue: 'b', timeout: 1000 }).then((value) => {
        secondAnswer = value
      })
      await vi.advanceTimersByTimeAsync(5000)
      expect(secondAnswer).toBeUndefined()

      screen.promptSubmit()
      await expect(first).resolves.toBe('a')
      await vi.advanceTimersByTimeAsync(999)
      expect(secondAnswer).toBeUndefined()
      await vi.advanceTimersByTimeAsync(1)
      expect(secondAnswer).toBe('b')
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes by itself once every screen with a status has succeeded', async () => {
    vi.useFakeTimers()
    try {
      const unmount = vi.fn()
      const manager = await managerWith({ name: 'fake', mount: () => ({ unmount }) })
      vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
      const screen = manager.createScreen({ name: 'Build', static: false })
      screen.setStatus('success')
      // Bound after the screen was done: the timer still starts.
      await manager.bind({ autoClose: 1000 })
      await vi.advanceTimersByTimeAsync(1000)
      expect(unmount).toHaveBeenCalledTimes(1)
      expect(manager.getRenderMode()).toBe(RenderMode.UNBOUND)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('ScreenInstance buffers', () => {
  it('keeps at most maxMessages messages', async () => {
    const container = new Container()
    const manager = await container.get(ScreenManager)
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const screen = manager.createScreen({ name: 'Log', maxMessages: 100 })
    for (let i = 0; i < 1000; i++) {
      screen.addMessage(createLogMessage({ id: `m${i}`, content: `line ${i}` }))
    }
    const messages = screen.getMessages()
    expect(messages.length).toBeLessThanOrEqual(100)
    expect(messages.at(-1)!.id).toBe('m999')
    vi.restoreAllMocks()
    await container.dispose()
  })

  it('does not print a static screen a second time when it gets a status', async () => {
    const container = new Container()
    const manager = await container.get(ScreenManager)
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const screen = manager.createScreen({ name: 'Log' })
    screen.addMessage(createLogMessage({ content: 'only once' }))
    screen.setStatus('success')
    screen.addMessage(createLogMessage({ content: 'afterwards' }))
    await manager.unbind()
    const printed = write.mock.calls.map(([text]) => String(text)).join('')
    expect(printed.split('only once')).toHaveLength(2)
    expect(printed).toContain('afterwards')
    vi.restoreAllMocks()
    await container.dispose()
  })
})
