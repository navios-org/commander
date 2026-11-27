import { createElement } from 'react'

import type { TuiAdapter, TuiMount, TuiMountProps } from '@navios/commander-tui'

import { ScreenManagerBridge } from './components/screen_manager_bridge.tsx'
import { withFullScreen } from './fullscreen/index.ts'

/**
 * Draws the screens with Ink. Runs on any Node.js that `@navios/commander-tui`
 * supports, and needs no native code.
 *
 * ```ts
 * import { tui } from '@navios/commander-tui'
 * import { inkAdapter } from '@navios/tui-adapter-ink'
 *
 * await runCli(AppModule, { plugins: [tui({ adapter: inkAdapter() })] })
 * ```
 */
export function inkAdapter(): TuiAdapter {
  return {
    name: 'ink',
    async mount({ manager, theme, options }: TuiMountProps): Promise<TuiMount> {
      const ink = withFullScreen(createElement(ScreenManagerBridge, { manager, theme }), {
        exitOnCtrlC: options.exitOnCtrlC ?? true,
      })
      // Switches to the alternate screen, then draws.
      await ink.start()
      // Ink unmounts by itself on Ctrl+C. The manager has to know, or it would
      // go on drawing into an interface that is gone.
      let unmounted = false
      void ink.waitUntilExit().then(() => {
        if (!unmounted) {
          unmounted = true
          void manager.unbind()
        }
      })
      return {
        async unmount(): Promise<void> {
          if (!unmounted) {
            unmounted = true
            ink.instance.unmount()
          }
          // Resolves once the main screen and the cursor are back.
          await ink.waitUntilExit()
        },
      }
    },
  }
}

// Re-export context and hooks for external use
export * from './context/index.ts'
export * from './hooks/index.ts'

// Re-export components
export { ScrollBox, type ScrollBoxProps } from './components/scroll/index.ts'
