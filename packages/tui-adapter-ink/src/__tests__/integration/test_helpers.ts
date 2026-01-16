import { EventEmitter } from 'node:events'

import { ScreenManager, ScreenLogger } from '@navios/commander-tui'
import { Container } from '@navios/core'
import { render } from 'ink'
import { createElement, type ReactNode } from 'react'
import stripAnsi from 'strip-ansi'

import type { ScreenManagerInstance, ScreenLoggerInstance } from '@navios/commander-tui'
import type { LogLevel } from '@navios/core'
import type { Instance as InkInstance } from 'ink'

import { FullScreenBox, withFullScreen } from '../../fullscreen/index.ts'

/**
 * Test dimensions for consistent snapshot rendering
 */
export const TEST_DIMENSIONS = {
  columns: 80,
  rows: 24,
} as const

/**
 * Create a fake stdout stream for testing.
 * Based on Ink's testing approach: https://github.com/vadimdemedes/ink/blob/master/test/helpers/create-stdout.ts
 */
export interface FakeStdout extends EventEmitter {
  columns: number
  rows: number
  write: (data: string) => boolean
  _lastFrame: string
  frames: string[]
}

export function createStdout(
  columns: number = TEST_DIMENSIONS.columns,
  rows: number = TEST_DIMENSIONS.rows,
): FakeStdout {
  const stdout = new EventEmitter() as FakeStdout
  stdout.columns = columns
  stdout.rows = rows
  stdout.frames = []
  stdout._lastFrame = ''

  stdout.write = (
    data: string,
    encodingOrCallback?: BufferEncoding | ((error?: Error | null) => void),
    callback?: (error?: Error | null) => void,
  ): boolean => {
    stdout._lastFrame = data
    stdout.frames.push(data)
    // Call callback if provided (required for promisified write)
    // Handle both (data, callback) and (data, encoding, callback) signatures
    const cb = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback
    if (typeof cb === 'function') {
      cb(null)
    }
    return true
  }

  return stdout
}

/**
 * Create a fake stdin stream for testing.
 */
export interface FakeStdin extends EventEmitter {
  setRawMode: () => void
  resume: () => void
  setEncoding: () => void
  ref: () => void
  unref: () => void
  isTTY: boolean
}

export function createStdin(): FakeStdin {
  const stdin = new EventEmitter() as FakeStdin
  stdin.isTTY = true
  stdin.setRawMode = () => {}
  stdin.resume = () => {}
  stdin.setEncoding = () => {}
  stdin.ref = () => {}
  stdin.unref = () => {}
  return stdin
}

/**
 * Test render result interface
 */
export interface TestRenderResult {
  /** The Ink render instance */
  instance: InkInstance
  /** The fake stdout stream */
  stdout: FakeStdout
  /** The fake stdin stream */
  stdin: FakeStdin
  /** Get the last rendered frame (with ANSI codes stripped) */
  lastFrame: () => string
  /** Get the last rendered frame (raw with ANSI codes) */
  lastFrameRaw: () => string
  /** Get all rendered frames */
  frames: () => string[]
  /** Unmount the component */
  unmount: () => void
  /** Rerender with new node */
  rerender: (node: ReactNode) => void
  /** Wait for the next frame to be rendered via onRender callback */
  waitForFrame: () => Promise<void>
  /** Frame count - number of times render has occurred */
  frameCount: () => number
}

/**
 * Render a component for testing using Ink's render with fake streams.
 */
export async function testRender(
  node: ReactNode,
  options: { columns?: number; rows?: number } = {},
): Promise<TestRenderResult> {
  const stdout = createStdout(
    options.columns ?? TEST_DIMENSIONS.columns,
    options.rows ?? TEST_DIMENSIONS.rows,
  )
  const stdin = createStdin()

  // Track render callbacks for waiting
  let renderResolvers: Array<() => void> = []

  const { instance, start } = withFullScreen(node, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
    debug: true, // Each update renders separately
    exitOnCtrlC: false,
    onRender: () => {
      // Resolve all pending waitForFrame promises
      const resolvers = renderResolvers
      renderResolvers = []
      for (const resolve of resolvers) {
        resolve()
      }
    },
  })

  await start()

  // Track frame count for detecting new frames
  let lastCheckedFrameCount = stdout.frames.length

  return {
    instance,
    stdout,
    stdin,
    lastFrame: () => stripAnsi(stdout._lastFrame),
    lastFrameRaw: () => stdout._lastFrame,
    frames: () => stdout.frames.map(stripAnsi),
    unmount: () => instance.unmount(),
    rerender: (newNode: ReactNode) =>
      instance.rerender(createElement(FullScreenBox, null, newNode)),
    waitForFrame: () =>
      new Promise<void>((resolve) => {
        // If we have new frames since last check, resolve immediately
        if (stdout.frames.length > lastCheckedFrameCount) {
          lastCheckedFrameCount = stdout.frames.length
          resolve()
        } else if (renderResolvers.length === 0 && stdout.frames.length > 0) {
          // First call after start() - content is already rendered
          resolve()
        } else {
          // Otherwise wait for the next render
          renderResolvers.push(resolve)
        }
      }),
    frameCount: () => stdout.frames.length,
  }
}

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
