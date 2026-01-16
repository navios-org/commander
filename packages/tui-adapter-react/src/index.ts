import { Adapter } from '@navios/commander-tui'
import { Injectable } from '@navios/core'
import { createRoot as reactCreateRoot } from '@opentui/react'
import { createElement } from 'react'

import type { AdapterInterface, AdapterRoot, AdapterRenderProps } from '@navios/commander-tui'
import type { CliRenderer } from '@opentui/core'

import { ScreenManagerBridge } from './components/screen_manager_bridge.tsx'

/**
 * React adapter for TUI rendering.
 * Automatically registers to DI when this module is imported.
 */
@Injectable({ token: Adapter })
export class ReactAdapter implements AdapterInterface {
  createRoot(renderer: CliRenderer): AdapterRoot {
    const root = reactCreateRoot(renderer)
    return {
      render(element: unknown): void {
        root.render(element as React.ReactNode)
      },
      unmount(): void {
        root.unmount()
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
