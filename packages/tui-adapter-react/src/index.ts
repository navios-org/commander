import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'
import { createElement } from 'react'

import type { TuiAdapter, TuiMount, TuiMountProps } from '@navios/commander-tui'

import { ScreenManagerBridge } from './components/screen_manager_bridge.tsx'
import { openTuiSupport } from './support.ts'

export { isNodeVersionAtLeast, OPENTUI_MIN_NODE_VERSION, openTuiSupport } from './support.ts'

/**
 * Draws the screens with OpenTUI, a native renderer with mouse support and
 * syntax highlighting. It runs on Bun, and on Node.js 26.4 or later started
 * with `--experimental-ffi`; anywhere else the screens print to standard
 * output, after a warning that says so.
 *
 * ```ts
 * import { tui } from '@navios/commander-tui'
 * import { openTuiAdapter } from '@navios/tui-adapter-react'
 *
 * await runCli(AppModule, { plugins: [tui({ adapter: openTuiAdapter() })] })
 * ```
 */
export function openTuiAdapter(): TuiAdapter {
  return {
    name: 'opentui',
    isSupported: () => openTuiSupport(),
    async mount({ manager, theme, options }: TuiMountProps): Promise<TuiMount> {
      const renderer = await createCliRenderer({
        exitOnCtrlC: options.exitOnCtrlC ?? true,
        screenMode: 'alternate-screen',
        useMouse: options.mouse ?? true,
      })
      let root: ReturnType<typeof createRoot>
      try {
        root = createRoot(renderer)
        root.render(createElement(ScreenManagerBridge, { manager, theme }))
      } catch (error) {
        // The terminal is already in the alternate screen: give it back.
        renderer.destroy()
        await renderer.closed.catch(() => {})
        throw error
      }
      return {
        async unmount(): Promise<void> {
          root.unmount()
          // Mouse reporting is switched off first, or its escape sequences leak
          // into the shell.
          ;(renderer as unknown as { disableMouse?: () => void }).disableMouse?.()
          renderer.destroy()
          // destroy() restores the terminal asynchronously. `closed` rejects on
          // a late or timed-out close; the renderer is released either way.
          await renderer.closed.catch(() => {})
        },
      }
    },
  }
}

// Re-export context and hooks for external use
export * from './context/index.ts'
export * from './hooks/index.ts'
