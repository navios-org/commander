import { Box, useInput } from 'ink'
import { forwardRef } from 'react'

import type { BoxProps, DOMElement } from 'ink'

import { useScreenSize } from './use_screen_size.ts'

/**
 * A Box component that fills the entire terminal screen.
 * Uses useInput to prevent input from rendering and shifting the layout.
 *
 * Ported from fullscreen-ink.
 */
export const FullScreenBox = forwardRef<DOMElement, BoxProps>(function FullScreenBox(props, ref) {
  // Prevent input from rendering and shifting the layout
  useInput(() => {})

  const { width, height } = useScreenSize()

  return <Box ref={ref} height={height} width={width} {...props} />
})
