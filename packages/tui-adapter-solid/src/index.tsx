import { Adapter } from '@navios/commander-tui'
import { Injectable } from '@navios/core'
import { render as solidRender } from '@opentui/solid'

import type { AdapterInterface, AdapterRoot, AdapterRenderProps } from '@navios/commander-tui'
import type { CliRenderer } from '@opentui/core'

import { ScreenManagerBridge } from './components/screen_manager_bridge.tsx'

/**
 * Solid adapter for TUI rendering.
 * Automatically registers to DI when this module is imported.
 */
@Injectable({ token: Adapter })
export class SolidAdapter implements AdapterInterface {
  createRoot(renderer: CliRenderer): AdapterRoot {
    let renderPromise: Promise<void> | undefined

    return {
      render(element: unknown): void {
        // Solid's render returns a Promise<void>
        // We start the render and let it run asynchronously
        renderPromise = solidRender(element as () => any, renderer)
      },
      unmount(): void {
        // Solid's render doesn't provide a dispose function in @opentui/solid
        // The unmount is handled by the renderer itself
        renderPromise = undefined
      },
    }
  }

  renderToRoot(root: AdapterRoot, props: AdapterRenderProps): void {
    // Create a component function that renders ScreenManagerBridge with the provided props
    // opentui/solid's render() calls createComponent(node, {}) which ignores props,
    // so we create a wrapper component that captures the props in its closure
    const App = () => (
      <ScreenManagerBridge manager={props.manager as any} theme={props.theme as any} />
    )
    root.render(App)
  }
}

// Re-export context and hooks for external use
export * from './context/index.ts'
export * from './hooks/index.ts'
