import { Adapter } from '@navios/commander-tui'
import { Injectable } from '@navios/core'
import { createElement } from 'react'

import type { AdapterInterface, AdapterRoot, AdapterRenderProps } from '@navios/commander-tui'

import { ScreenManagerBridge } from './components/screen_manager_bridge.tsx'
import { withFullScreen } from './fullscreen/index.ts'

import type { WithFullScreen } from './fullscreen/index.ts'

/**
 * Ink adapter for TUI rendering.
 * Uses Ink's native rendering system instead of OpenTUI.
 * Uses internal fullscreen utilities for alternate screen buffer and fullscreen support.
 * Automatically registers to DI when this module is imported.
 */
@Injectable({ token: Adapter })
export class InkAdapter implements AdapterInterface {
  /**
   * This adapter handles its own rendering without requiring OpenTUI's CliRenderer.
   */
  readonly handlesOwnRenderer = true

  createRoot(): AdapterRoot {
    let ink: WithFullScreen | null = null

    return {
      render(element: unknown): void {
        if (ink) {
          // Re-render with new element
          ink.instance.rerender(element as React.ReactNode)
        } else {
          // Initial render with fullscreen mode (alternate screen buffer, fills terminal)
          ink = withFullScreen(element as React.ReactNode, {
            exitOnCtrlC: true,
          })
          // Start the fullscreen app (switches to alternate screen buffer)
          ink.start()
        }
      },
      async unmount(): Promise<void> {
        if (ink) {
          ink.instance.unmount()
          // Wait for fullscreen to properly exit and cleanup
          await ink.waitUntilExit()
          ink = null
        }
      },
    }
  }

  renderToRoot(root: AdapterRoot, props: AdapterRenderProps): void {
    const element = createElement(ScreenManagerBridge, props as any)
    root.render(element)
  }
}

// Re-export context and hooks for external use
export * from './context/index.ts'
export * from './hooks/index.ts'

// Re-export components
export { ScrollBox, type ScrollBoxProps } from './components/scroll/index.ts'
