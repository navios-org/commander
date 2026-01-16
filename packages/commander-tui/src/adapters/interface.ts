import type { CliRenderer } from '@opentui/core'

import type { Theme } from '../types/index.ts'

/**
 * Root instance returned by adapter's createRoot method.
 * Abstracts the framework-specific root implementation.
 */
export interface AdapterRoot {
  /**
   * Render an element to the root.
   * @param element - Framework-specific element to render
   */
  render(element: unknown): void

  /**
   * Unmount and cleanup the root.
   * Can be async to allow waiting for cleanup to complete.
   */
  unmount(): void | Promise<void>
}

/**
 * Props passed to the adapter's internal bridge component.
 * The manager type is kept generic to avoid circular imports.
 */
export interface AdapterRenderProps {
  manager: unknown
  theme?: Theme
}

/**
 * Abstract interface for rendering adapters.
 * Implementations provide framework-specific rendering capabilities.
 */
export interface AdapterInterface {
  /**
   * Whether this adapter handles its own rendering without requiring
   * the ScreenManager to create an OpenTUI CliRenderer.
   * When true, createRoot() will be called without a renderer argument.
   * @default false
   */
  readonly handlesOwnRenderer?: boolean

  /**
   * Create a root instance for rendering.
   * @param renderer - CLI renderer from @opentui/core (undefined if handlesOwnRenderer is true)
   * @returns Root instance with render/unmount methods, or a Promise that resolves to one
   */
  createRoot(renderer?: CliRenderer): AdapterRoot | Promise<AdapterRoot>

  /**
   * Render the adapter's internal bridge component to the root.
   * The adapter owns its bridge component - no component is passed in.
   * @param root - Root instance created by createRoot
   * @param props - Props to pass to the bridge component
   */
  renderToRoot(root: AdapterRoot, props: AdapterRenderProps): void
}
