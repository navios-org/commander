import { useStdin } from 'ink'
import { useEffect, useRef, useCallback } from 'react'

export interface MouseScrollEvent {
  direction: 'up' | 'down'
  x: number
  y: number
}

export interface UseMouseScrollOptions {
  onScroll: (event: MouseScrollEvent) => void
  isActive?: boolean
}

/**
 * Hook to handle mouse scroll events in the terminal.
 *
 * Terminal mouse tracking uses SGR (1006) mode escape sequences:
 * - Enable: \x1b[?1000h\x1b[?1006h (enable mouse tracking + SGR mode)
 * - Disable: \x1b[?1006l\x1b[?1000l
 *
 * Mouse wheel events are encoded as:
 * - \x1b[<64;X;YM for scroll up
 * - \x1b[<65;X;YM for scroll down
 */
export function useMouseScroll({ onScroll, isActive = true }: UseMouseScrollOptions): void {
  // useStdin may return undefined values in test environments
  const stdinResult = useStdin()
  const stdin = stdinResult?.stdin
  const isRawModeSupported = stdinResult?.isRawModeSupported ?? false
  const enabledRef = useRef(false)

  const handleData = useCallback(
    (data: Buffer) => {
      const str = data.toString()

      // Parse SGR mouse events: \x1b[<button;x;yM or \x1b[<button;x;ym
      // Button 64 = scroll up, Button 65 = scroll down
      const sgrMatch = str.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/)
      if (sgrMatch) {
        const button = parseInt(sgrMatch[1]!, 10)
        const x = parseInt(sgrMatch[2]!, 10)
        const y = parseInt(sgrMatch[3]!, 10)

        // 64 = scroll up, 65 = scroll down (in SGR mode)
        if (button === 64) {
          onScroll({ direction: 'up', x, y })
        } else if (button === 65) {
          onScroll({ direction: 'down', x, y })
        }
        return
      }

      // Also handle X10 mouse protocol (legacy): \x1b[M followed by 3 bytes
      // Scroll up: button byte = 0x60 (96), scroll down: button byte = 0x61 (97)
      if (str.startsWith('\x1b[M') && str.length >= 6) {
        const button = str.charCodeAt(3) - 32
        const x = str.charCodeAt(4) - 32
        const y = str.charCodeAt(5) - 32

        // 64 = scroll up, 65 = scroll down
        if (button === 64) {
          onScroll({ direction: 'up', x, y })
        } else if (button === 65) {
          onScroll({ direction: 'down', x, y })
        }
      }
    },
    [onScroll],
  )

  useEffect(() => {
    if (!isActive || !stdin || !isRawModeSupported) {
      return
    }

    // Enable mouse tracking with SGR mode for better coordinate support
    // \x1b[?1000h - Enable mouse click tracking
    // \x1b[?1002h - Enable mouse button tracking (includes drag)
    // \x1b[?1006h - Enable SGR extended mouse mode (better coordinates)
    const enableSequence = '\x1b[?1000h\x1b[?1002h\x1b[?1006h'
    const disableSequence = '\x1b[?1006l\x1b[?1002l\x1b[?1000l'

    // Write enable sequence to stdout (terminal) - only in real terminal environment
    try {
      process.stdout.write(enableSequence)
      enabledRef.current = true
    } catch {
      // Ignore errors in test environments
      return
    }

    // Listen for data on stdin
    stdin.on('data', handleData)

    return () => {
      stdin.off('data', handleData)
      if (enabledRef.current) {
        try {
          process.stdout.write(disableSequence)
        } catch {
          // Ignore errors in test environments
        }
        enabledRef.current = false
      }
    }
  }, [stdin, isRawModeSupported, isActive, handleData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (enabledRef.current) {
        try {
          process.stdout.write('\x1b[?1006l\x1b[?1002l\x1b[?1000l')
        } catch {
          // Ignore errors in test environments
        }
        enabledRef.current = false
      }
    }
  }, [])
}
