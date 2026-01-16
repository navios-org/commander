import { TestContainer } from '@navios/core/testing'

import { Screen, ScreenLogger, Prompt } from '../../tokens/index.ts'

import type { ScreenInstance } from '../../services/index.ts'

import { createMockScreenInstance } from './factories.ts'

import type { MockScreenInstance } from './factories.ts'

/**
 * Create a pre-configured TestContainer for commander-tui tests.
 * Includes common bindings for Screen token with a mock instance.
 */
export function createTestContainer(): TestContainer {
  return new TestContainer()
}

/**
 * Bind a mock ScreenInstance to the Screen token.
 * Returns the mock for assertions.
 */
export function bindMockScreen(
  container: TestContainer,
  overrides?: Partial<MockScreenInstance>,
): MockScreenInstance {
  const mockScreen = createMockScreenInstance(overrides)
  // Cast through unknown since MockScreenInstance has mock functions instead of real implementations
  container.bind(Screen).toValue(mockScreen as unknown as ScreenInstance)
  return mockScreen
}

/**
 * Rebind a mock ScreenInstance to the Screen token.
 * Must invalidate the previous instance first.
 */
export function rebindMockScreen(
  container: TestContainer,
  previousInstance: MockScreenInstance,
  overrides?: Partial<MockScreenInstance>,
): MockScreenInstance {
  const mockScreen = createMockScreenInstance(overrides)
  container.invalidate(previousInstance as unknown as ScreenInstance)
  // Cast through unknown since MockScreenInstance has mock functions instead of real implementations
  container.bind(Screen).toValue(mockScreen as unknown as ScreenInstance)
  return mockScreen
}

export { TestContainer, Screen, ScreenLogger, Prompt }
