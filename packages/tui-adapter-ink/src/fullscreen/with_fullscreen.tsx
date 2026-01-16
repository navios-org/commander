import { render } from 'ink'
import { createElement } from 'react'

import type { Instance as InkInstance, RenderOptions } from 'ink'
import type { ReactNode } from 'react'

import { FullScreenBox } from './fullscreen_box.tsx'

/**
 * Terminal escape sequences for fullscreen mode
 */
const ESCAPE_SEQUENCES = {
  // Enter alternate screen buffer
  ENTER_ALT_SCREEN: '\x1b[?1049h',
  // Exit alternate screen buffer
  EXIT_ALT_SCREEN: '\x1b[?1049l',
  // Hide cursor
  HIDE_CURSOR: '\x1b[?25l',
  // Show cursor
  SHOW_CURSOR: '\x1b[?25h',
  // Clear screen
  CLEAR_SCREEN: '\x1b[2J',
  // Move cursor to home position (1,1)
  CURSOR_HOME: '\x1b[H',
} as const

/**
 * Complete sequence to enter fullscreen mode
 */
const ENTER_FULLSCREEN =
  ESCAPE_SEQUENCES.ENTER_ALT_SCREEN +
  ESCAPE_SEQUENCES.HIDE_CURSOR +
  ESCAPE_SEQUENCES.CLEAR_SCREEN +
  ESCAPE_SEQUENCES.CURSOR_HOME

/**
 * Complete sequence to exit fullscreen mode
 */
const EXIT_FULLSCREEN = ESCAPE_SEQUENCES.SHOW_CURSOR + ESCAPE_SEQUENCES.EXIT_ALT_SCREEN

/**
 * Result of withFullScreen function
 */
export interface WithFullScreen {
  /** The Ink render instance */
  instance: InkInstance
  /** Start fullscreen mode - enters alternate screen buffer and begins rendering */
  start: () => Promise<void>
  /** Wait for the instance to exit */
  waitUntilExit: () => Promise<void>
}

/**
 * Options for withFullScreen
 */
export type WithFullScreenOptions = Omit<RenderOptions, 'patchConsole'>

/**
 * Helper to write to stdout as a Promise
 */
function write(data: string, stdout: NodeJS.WriteStream = process.stdout): Promise<void> {
  return new Promise((resolve, reject) => {
    stdout.write(data, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

/**
 * Creates a fullscreen Ink application with proper terminal handling.
 *
 * Sends the following sequences on start:
 * - \x1b[?1049h - Enter alternate screen buffer
 * - \x1b[?25l   - Hide cursor
 * - \x1b[2J     - Clear screen
 * - \x1b[H      - Move cursor to home
 *
 * Sends the following sequences on exit:
 * - \x1b[?25h   - Show cursor
 * - \x1b[?1049l - Exit alternate screen buffer
 *
 * @param node - React node to render
 * @param options - Ink render options
 * @returns Object with instance, start(), and waitUntilExit() methods
 */
export function withFullScreen(node: ReactNode, options?: WithFullScreenOptions): WithFullScreen {
  const stdout = (options?.stdout as NodeJS.WriteStream) ?? process.stdout

  // Create the Ink instance with the node wrapped in FullScreenBox immediately
  // The escape sequences will be sent in start()
  const instance = render(null, {
    ...options,
    patchConsole: false,
  })

  // Track if cleanup has been done
  let cleanedUp = false
  let started = false
  let listenersRegistered = false

  /**
   * Cleanup function to exit fullscreen mode
   */
  const cleanup = async () => {
    if (cleanedUp || !started) return
    cleanedUp = true
    await write(EXIT_FULLSCREEN, stdout)
  }

  // Set up cleanup on process exit signals (only added in start())
  const handleExit = () => {
    if (!started) return
    // Synchronous write for exit handlers
    stdout.write(EXIT_FULLSCREEN)
  }

  const registerListeners = () => {
    if (listenersRegistered) return
    listenersRegistered = true
    process.on('exit', handleExit)
    process.on('SIGINT', handleExit)
    process.on('SIGTERM', handleExit)
  }

  const unregisterListeners = () => {
    if (!listenersRegistered) return
    listenersRegistered = false
    process.off('exit', handleExit)
    process.off('SIGINT', handleExit)
    process.off('SIGTERM', handleExit)
  }

  // Clean up event listeners when instance exits
  instance.waitUntilExit().then(unregisterListeners)

  return {
    instance,

    async start(): Promise<void> {
      started = true
      // Register signal handlers only when we actually enter fullscreen
      registerListeners()
      // Enter fullscreen mode
      await write(ENTER_FULLSCREEN, stdout)
      // Now render the actual content wrapped in FullScreenBox
      instance.rerender(createElement(FullScreenBox, null, node))
    },

    async waitUntilExit(): Promise<void> {
      await instance.waitUntilExit()
      await cleanup()
    },
  }
}
