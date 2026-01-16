import { useStdout } from 'ink'
import { useCallback, useEffect, useState } from 'react'

export interface ScreenSize {
  width: number
  height: number
}

/**
 * Returns an up-to-date screen size object with `height` and `width` properties
 * that reflect the current size of the terminal.
 *
 * Ported from fullscreen-ink with improvements.
 */
export function useScreenSize(): ScreenSize {
  const { stdout } = useStdout()

  const getSize = useCallback((): ScreenSize => {
    return {
      width: stdout?.columns ?? 80,
      height: stdout?.rows ?? 24,
    }
  }, [stdout])

  const [size, setSize] = useState<ScreenSize>(getSize)

  useEffect(() => {
    const handleResize = () => {
      setSize(getSize())
    }

    stdout?.on('resize', handleResize)
    return () => {
      stdout?.off('resize', handleResize)
    }
  }, [stdout, getSize])

  return size
}
