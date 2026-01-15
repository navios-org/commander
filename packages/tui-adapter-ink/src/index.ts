import { Injectable } from '@navios/core'
import { Adapter } from '@navios/commander-tui'
import { withFullScreen } from 'fullscreen-ink'
import { createElement } from 'react'

import type { AdapterInterface, AdapterRoot, AdapterRenderProps } from '@navios/commander-tui'

import { ScreenManagerBridge } from './components/screen_manager_bridge.tsx'

/**
 * Ink adapter for TUI rendering.
 * Uses Ink's native rendering system instead of OpenTUI.
 * Uses fullscreen-ink for alternate screen buffer and fullscreen support.
 * Automatically registers to DI when this module is imported.
 */
@Injectable({ token: Adapter })
export class InkAdapter implements AdapterInterface {
  /**
   * This adapter handles its own rendering without requiring OpenTUI's CliRenderer.
   */
  readonly handlesOwnRenderer = true

  createRoot(): AdapterRoot {
    let ink: ReturnType<typeof withFullScreen> | null = null

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
      unmount(): void {
        if (ink) {
          ink.instance.unmount()
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
