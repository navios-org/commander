import { Injectable } from '@navios/core'

import { Adapter } from '../tokens/index.ts'

import type { AdapterInterface, AdapterRoot } from '../adapters/index.ts'

const MISSING_ADAPTER_ERROR =
  'Adapter not registered, add import statement for @navios/tui-adapter-react, @navios/tui-adapter-ink or @navios/tui-adapter-solid to your module'

/**
 * Fallback adapter that is used when no TUI adapter is registered.
 * The `isMissingAdapter` marker allows ScreenManager to detect this
 * and gracefully fall back to stdout mode instead of throwing.
 */
@Injectable({ token: Adapter, priority: -100 })
export class MissingAdapterOverride implements AdapterInterface {
  /**
   * Marker property to identify this as the missing adapter fallback.
   * Used by ScreenManager.bind() to detect and handle graceful fallback.
   */
  readonly isMissingAdapter = true

  createRoot(): AdapterRoot {
    throw new Error(MISSING_ADAPTER_ERROR)
  }

  renderToRoot(): void {
    throw new Error(MISSING_ADAPTER_ERROR)
  }
}
