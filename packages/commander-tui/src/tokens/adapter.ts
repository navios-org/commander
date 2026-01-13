import { InjectionToken } from '@navios/core'

import type { AdapterInterface } from '../adapters/interface.ts'

/**
 * Injection token for the TUI rendering adapter.
 * Import the specific adapter (e.g., '@navios/commander-tui/adapters/react')
 * to register an implementation.
 */
export const Adapter = InjectionToken.create<AdapterInterface>('Adapter')
