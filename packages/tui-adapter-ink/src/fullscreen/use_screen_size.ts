import { useWindowSize } from 'ink'

export interface ScreenSize {
  width: number
  height: number
}

/**
 * Returns an up-to-date screen size object with `height` and `width` properties
 * that reflect the current size of the terminal.
 *
 * Built on Ink's `useWindowSize`, which re-renders on terminal resize.
 */
export function useScreenSize(): ScreenSize {
  const { columns, rows } = useWindowSize()
  return { width: columns, height: rows }
}
