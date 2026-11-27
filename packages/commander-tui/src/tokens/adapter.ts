import { InjectionToken } from '@navios/core'

import type { TuiAdapter } from '../adapters/interface.ts'

/**
 * The adapter that draws the screens. `tui({ adapter })` provides it;
 * without one the screens print to standard output.
 */
export const Adapter = InjectionToken.create<TuiAdapter>('TuiAdapter')
