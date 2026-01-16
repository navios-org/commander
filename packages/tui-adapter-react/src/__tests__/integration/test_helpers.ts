import { ScreenManager, ScreenLogger } from '@navios/commander-tui'
import { Container } from '@navios/core'
import { act } from 'react'

import type { ScreenManagerInstance, ScreenLoggerInstance } from '@navios/commander-tui'
import type { LogLevel } from '@navios/core'

export { testRender } from '@opentui/react/test-utils'

/**
 * Re-export act from React for wrapping state mutations in tests.
 * This is needed for progressive rendering tests where external
 * state (like logger messages) triggers React re-renders via useSyncExternalStore.
 */
export { act }

/**
 * Create a fresh Container and ScreenManager for integration tests.
 * Returns both the container (for cleanup) and the manager.
 */
export async function createTestScreenManager(): Promise<{
  container: Container
  manager: ScreenManagerInstance
}> {
  const container = new Container()
  const manager = (await container.get(ScreenManager)) as ScreenManagerInstance
  return { container, manager }
}

/**
 * Create a ScreenLogger for a given screen name.
 * Uses the same container to ensure proper DI wiring.
 */
export async function createTestLogger(
  container: Container,
  screenName: string,
  enabledLevels: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
): Promise<ScreenLoggerInstance> {
  return (await container.get(ScreenLogger, {
    screen: screenName,
    enabledLevels,
  })) as ScreenLoggerInstance
}

/**
 * Test dimensions for consistent snapshot rendering
 */
export const TEST_DIMENSIONS = {
  width: 80,
  height: 24,
} as const
