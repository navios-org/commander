import { Injectable } from '@navios/core'

import { Adapter } from '../tokens/index.ts'

import type { AdapterInterface, AdapterRoot } from '../adapters/index.ts'

@Injectable({ token: Adapter, priority: -100 })
export class MissingAdapterOverride implements AdapterInterface {
  createRoot(): AdapterRoot {
    throw new Error(
      'Adapter not registered, add import statement for @navios/commander-tui/adapters/react or @navios/commander-tui/adapters/solid to your module',
    )
  }

  renderToRoot(): void {
    throw new Error(
      'Adapter not registered, add import statement for @navios/commander-tui/adapters/react or @navios/commander-tui/adapters/solid to your module',
    )
  }
}
