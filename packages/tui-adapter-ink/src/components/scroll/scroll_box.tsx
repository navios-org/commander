import { Box, Text, measureElement } from 'ink'
import {
  Children,
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  useMemo,
  isValidElement,
} from 'react'

import type { BoxProps, DOMElement } from 'ink'
import type { ReactNode, RefObject } from 'react'

import { useMouseScroll } from '../../hooks/use_mouse_scroll.ts'

/**
 * Safe wrapper for measureElement that handles errors gracefully.
 */
function safeMeasureElement(element: DOMElement | null): { width: number; height: number } {
  if (!element) {
    return { width: 0, height: 0 }
  }
  try {
    return measureElement(element)
  } catch {
    return { width: 0, height: 0 }
  }
}

/**
 * MeasurableItem wraps each child and measures its height.
 * Uses useLayoutEffect for synchronous measurement to prevent flickering.
 */
interface MeasurableItemProps {
  children: ReactNode
  itemKey: string | number
  onMeasure: (key: string | number, height: number) => void
}

function MeasurableItem({ children, itemKey, onMeasure }: MeasurableItemProps) {
  const ref = useRef<DOMElement>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      const { height } = safeMeasureElement(ref.current)
      onMeasure(itemKey, height)
    }
  })

  return (
    <Box ref={ref as RefObject<DOMElement>} flexShrink={0} flexDirection="column">
      {children}
    </Box>
  )
}

export interface ScrollBoxProps extends Omit<BoxProps, 'overflow' | 'overflowX' | 'overflowY'> {
  children: ReactNode
  /**
   * Height of the scrollable viewport. If not provided, uses flexGrow.
   */
  height?: number
  /**
   * Enable sticky scroll - automatically scroll to bottom when new content is added.
   * User scrolling up will temporarily disable sticky scroll until they scroll back to bottom.
   */
  stickyScroll?: boolean
  /**
   * Enable mouse scroll support.
   * @default true
   */
  mouseScroll?: boolean
  /**
   * Number of lines to scroll per mouse wheel event.
   * @default 3
   */
  scrollStep?: number
  /**
   * Show scrollbar when content overflows.
   * @default true
   */
  showScrollbar?: boolean
  /**
   * Scrollbar track character.
   * @default '│'
   */
  scrollbarTrackChar?: string
  /**
   * Scrollbar thumb character.
   * @default '┃'
   */
  scrollbarThumbChar?: string
  /**
   * Color for scrollbar track.
   */
  scrollbarTrackColor?: string
  /**
   * Color for scrollbar thumb.
   */
  scrollbarThumbColor?: string
  /**
   * Callback when scroll position changes.
   */
  onScroll?: (scrollTop: number, maxScroll: number) => void
  /**
   * Enable vertical scrolling.
   * @default true
   */
  scrollY?: boolean
}

/**
 * A scrollable container component for Ink with mouse scroll support,
 * sticky scroll behavior, and visual scrollbar.
 *
 * Each child is wrapped in a MeasurableItem to track its actual height.
 * Content height is the sum of all measured item heights.
 */
export function ScrollBox({
  children,
  height,
  stickyScroll = false,
  mouseScroll = true,
  scrollStep = 3,
  showScrollbar = true,
  scrollbarTrackChar = '│',
  scrollbarThumbChar = '┃',
  scrollbarTrackColor,
  scrollbarThumbColor,
  onScroll,
  scrollY = true,
  ...boxProps
}: ScrollBoxProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const viewportRef = useRef<DOMElement>(null)
  const itemHeightsRef = useRef<Map<string | number, number>>(new Map())
  const prevChildCountRef = useRef(0)

  // Get child array and count
  const childArray = Children.toArray(children)
  const childCount = childArray.length

  // Calculate max scroll position
  const maxScroll = Math.max(0, contentHeight - viewportHeight)

  // Check if scrolling is needed
  const needsScroll = contentHeight > viewportHeight

  // Handle item measurement - accumulate heights
  const handleItemMeasure = useCallback((key: string | number, height: number) => {
    const currentHeight = itemHeightsRef.current.get(key)
    if (currentHeight !== height) {
      itemHeightsRef.current.set(key, height)

      // Recalculate total content height
      let totalHeight = 0
      itemHeightsRef.current.forEach((h) => {
        totalHeight += h
      })
      setContentHeight(totalHeight)
    }
  }, [])

  // Measure viewport
  useLayoutEffect(() => {
    if (viewportRef.current) {
      const { height: h } = safeMeasureElement(viewportRef.current)
      if (h > 0) {
        setViewportHeight(h)
      }
    }
  })

  // Clamp scrollTop when maxScroll changes (e.g., when viewport is measured)
  useLayoutEffect(() => {
    if (scrollTop > maxScroll && maxScroll >= 0) {
      setScrollTop(maxScroll)
    }
  }, [scrollTop, maxScroll])

  // Track previous content height for sticky scroll
  const prevContentHeightRef = useRef(0)

  // Handle sticky scroll - auto-scroll to bottom when content grows
  useLayoutEffect(() => {
    // Only apply sticky scroll after viewport is measured
    if (viewportHeight === 0) return

    // Scroll to bottom if:
    // 1. stickyScroll is enabled AND we're at the bottom
    // 2. AND either child count increased OR content height increased
    const childCountIncreased = childCount > prevChildCountRef.current
    const contentHeightIncreased = contentHeight > prevContentHeightRef.current

    if (stickyScroll && isAtBottom && (childCountIncreased || contentHeightIncreased)) {
      setScrollTop(maxScroll)
    }

    prevChildCountRef.current = childCount
    prevContentHeightRef.current = contentHeight
  }, [stickyScroll, isAtBottom, childCount, contentHeight, viewportHeight, maxScroll])

  // Scroll handler
  const handleScroll = useCallback(
    (delta: number) => {
      if (!scrollY) return

      setScrollTop((prev) => {
        const currentMaxScroll = Math.max(0, contentHeight - viewportHeight)
        const newScrollTop = Math.max(0, Math.min(currentMaxScroll, prev + delta))
        const atBottom = newScrollTop >= currentMaxScroll - 1
        setIsAtBottom(atBottom)
        onScroll?.(newScrollTop, currentMaxScroll)
        return newScrollTop
      })
    },
    [contentHeight, viewportHeight, onScroll, scrollY],
  )

  // Mouse scroll handler
  useMouseScroll({
    onScroll: (event) => {
      const delta = event.direction === 'down' ? scrollStep : -scrollStep
      handleScroll(delta)
    },
    isActive: mouseScroll && needsScroll,
  })

  // Calculate scrollbar dimensions
  const scrollbarHeight = viewportHeight
  const thumbSize = Math.max(
    1,
    Math.floor((viewportHeight / Math.max(1, contentHeight)) * scrollbarHeight),
  )
  const thumbPosition =
    maxScroll > 0 ? Math.floor((scrollTop / maxScroll) * (scrollbarHeight - thumbSize)) : 0

  // Build scrollbar characters
  const scrollbar = useMemo(() => {
    if (!showScrollbar || !needsScroll || scrollbarHeight <= 0) {
      return null
    }

    const chars: { char: string; isThumb: boolean }[] = []
    for (let i = 0; i < scrollbarHeight; i++) {
      const isThumb = i >= thumbPosition && i < thumbPosition + thumbSize
      chars.push({ char: isThumb ? scrollbarThumbChar : scrollbarTrackChar, isThumb })
    }
    return chars
  }, [
    showScrollbar,
    needsScroll,
    scrollbarHeight,
    thumbPosition,
    thumbSize,
    scrollbarTrackChar,
    scrollbarThumbChar,
  ])

  // Wrap each child in MeasurableItem
  const wrappedChildren = useMemo(() => {
    return childArray.map((child, index) => {
      // Use the child's key if available, otherwise use index
      const key = isValidElement(child) && child.key != null ? child.key : index
      return (
        <MeasurableItem key={key} itemKey={key} onMeasure={handleItemMeasure}>
          {child}
        </MeasurableItem>
      )
    })
  }, [childArray, handleItemMeasure])

  return (
    <Box {...boxProps} flexDirection="row">
      {/* Viewport container */}
      <Box
        ref={viewportRef as RefObject<DOMElement>}
        flexGrow={1}
        flexDirection="column"
        height={height}
        overflowY="hidden"
      >
        {/* Content container with negative marginTop for scroll effect */}
        <Box flexDirection="column" marginTop={-scrollTop}>
          {wrappedChildren}
        </Box>
      </Box>

      {/* Scrollbar */}
      {scrollbar && (
        <Box flexDirection="column" width={1}>
          {scrollbar.map((item, index) => (
            <Text
              key={`scrollbar-${index}`}
              color={item.isThumb ? scrollbarThumbColor : scrollbarTrackColor}
            >
              {item.char}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  )
}
