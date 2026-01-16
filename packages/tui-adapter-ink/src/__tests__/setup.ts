/**
 * Vitest setup file for tui-adapter-ink tests.
 *
 * Mocks ink and internal fullscreen utilities to avoid terminal interactions during tests.
 */
import { vi } from 'vitest'

// Mock internal fullscreen utilities
vi.mock('../fullscreen/index.ts', () => ({
  withFullScreen: vi.fn(() => ({
    instance: {
      rerender: vi.fn(),
      unmount: vi.fn(),
    },
    start: vi.fn(),
    waitUntilExit: vi.fn(() => Promise.resolve()),
  })),
  useScreenSize: vi.fn(() => ({ width: 80, height: 24 })),
  FullScreenBox: ({ children }: { children?: React.ReactNode }) => children,
}))

// Mock ink
vi.mock('ink', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => children,
  Text: ({ children }: { children?: React.ReactNode }) => children,
  useInput: vi.fn(),
  useApp: vi.fn(() => ({ exit: vi.fn() })),
  useStdin: vi.fn(() => ({ isRawModeSupported: true })),
  useFocus: vi.fn(() => ({ isFocused: false })),
  useFocusManager: vi.fn(() => ({ focusNext: vi.fn(), focusPrevious: vi.fn() })),
  render: vi.fn(() => ({
    rerender: vi.fn(),
    unmount: vi.fn(),
    waitUntilExit: vi.fn(() => Promise.resolve()),
  })),
}))

// Mock ink-syntax-highlight
vi.mock('ink-syntax-highlight', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
}))

// Mock ink-virtual-list
vi.mock('ink-virtual-list', () => ({
  default: vi.fn(({ items, itemRenderer }) =>
    items?.map((item: unknown, index: number) => itemRenderer(item, index)),
  ),
}))

// Mock @navios/commander-tui exports that require runtime
vi.mock('@navios/commander-tui', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    // Keep all the actual exports, no need to mock
  }
})
