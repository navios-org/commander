import { InjectionToken } from '@navios/core'

import type { ScreenManagerInstance } from '../services/screen_manager.ts'

/**
 * Injection token for the ScreenManager singleton.
 * Used for dependency injection without requiring direct import of the class.
 */
export const ScreenManager = InjectionToken.create<ScreenManagerInstance>('ScreenManager')
