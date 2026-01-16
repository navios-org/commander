import { describe, it, expect, vi, beforeEach } from 'vitest'

import { withFullScreen } from '../fullscreen/index.ts'
import { InkAdapter } from '../index.ts'

import { createMockScreenManagerInstance, asMockManager } from './mocks/factories.ts'

vi.mock('../fullscreen/index.ts', () => ({
  withFullScreen: vi.fn(() => ({
    instance: {
      rerender: vi.fn(),
      unmount: vi.fn(),
    },
    start: vi.fn(),
    waitUntilExit: vi.fn(() => Promise.resolve()),
  })),
}))

describe('InkAdapter', () => {
  let adapter: InkAdapter

  beforeEach(() => {
    adapter = new InkAdapter()
    vi.clearAllMocks()
  })

  describe('handlesOwnRenderer', () => {
    it('should be true', () => {
      expect(adapter.handlesOwnRenderer).toBe(true)
    })
  })

  describe('createRoot', () => {
    it('should return an object with render and unmount methods', () => {
      const root = adapter.createRoot()

      expect(root).toHaveProperty('render')
      expect(root).toHaveProperty('unmount')
      expect(typeof root.render).toBe('function')
      expect(typeof root.unmount).toBe('function')
    })

    it('should call withFullScreen on first render', () => {
      const mockInk = {
        instance: { rerender: vi.fn(), unmount: vi.fn() },
        start: vi.fn(),
      }
      vi.mocked(withFullScreen).mockReturnValue(mockInk)

      const root = adapter.createRoot()
      root.render(<div>Test</div>)

      expect(withFullScreen).toHaveBeenCalledWith(<div>Test</div>, { exitOnCtrlC: true })
      expect(mockInk.start).toHaveBeenCalled()
    })

    it('should rerender on subsequent render calls', () => {
      const mockInk = {
        instance: { rerender: vi.fn(), unmount: vi.fn() },
        start: vi.fn(),
      }
      vi.mocked(withFullScreen).mockReturnValue(mockInk)

      const root = adapter.createRoot()
      root.render(<div>First</div>)
      root.render(<div>Second</div>)

      expect(withFullScreen).toHaveBeenCalledTimes(1)
      expect(mockInk.instance.rerender).toHaveBeenCalledWith(<div>Second</div>)
    })

    it('should unmount ink instance on unmount', async () => {
      const mockInk = {
        instance: { rerender: vi.fn(), unmount: vi.fn() },
        start: vi.fn(),
        waitUntilExit: vi.fn(() => Promise.resolve()),
      }
      vi.mocked(withFullScreen).mockReturnValue(mockInk)

      const root = adapter.createRoot()
      root.render(<div>Test</div>)
      await root.unmount()

      expect(mockInk.instance.unmount).toHaveBeenCalled()
      expect(mockInk.waitUntilExit).toHaveBeenCalled()
    })

    it('should not throw on unmount when not rendered', async () => {
      const root = adapter.createRoot()

      await expect(root.unmount()).resolves.toBeUndefined()
    })
  })

  describe('renderToRoot', () => {
    it('should render ScreenManagerBridge with provided props', () => {
      const mockInk = {
        instance: { rerender: vi.fn(), unmount: vi.fn() },
        start: vi.fn(),
      }
      vi.mocked(withFullScreen).mockReturnValue(mockInk)

      const root = adapter.createRoot()
      const mockManager = createMockScreenManagerInstance()

      adapter.renderToRoot(root, { manager: asMockManager(mockManager) })

      expect(withFullScreen).toHaveBeenCalled()
      const renderedElement = vi.mocked(withFullScreen).mock.calls[0][0] as React.ReactElement
      expect(renderedElement.type).toBeDefined()
    })

    it('should pass theme prop to ScreenManagerBridge', () => {
      const mockInk = {
        instance: { rerender: vi.fn(), unmount: vi.fn() },
        start: vi.fn(),
      }
      vi.mocked(withFullScreen).mockReturnValue(mockInk)

      const root = adapter.createRoot()
      const mockManager = createMockScreenManagerInstance()
      const theme = { name: 'custom' }

      adapter.renderToRoot(root, { manager: asMockManager(mockManager), theme: theme as any })

      expect(withFullScreen).toHaveBeenCalled()
    })
  })
})
