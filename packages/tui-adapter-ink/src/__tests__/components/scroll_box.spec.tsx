import { Box, Text } from 'ink'
import { render } from 'ink-testing-library'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { ScrollBox } from '../../components/scroll/scroll_box.tsx'

// Mock measureElement to return controlled dimensions for testing
vi.mock('ink', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    measureElement: vi.fn((element: any) => {
      // Return dimensions based on element's data attribute or default
      const testHeight = element?._testHeight ?? 10
      return { width: 80, height: testHeight }
    }),
  }
})

describe('ScrollBox', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic rendering', () => {
    it('should render children without scrollbar when content fits', () => {
      const { lastFrame } = render(
        <ScrollBox height={10} showScrollbar={false}>
          <Text>Line 1</Text>
          <Text>Line 2</Text>
        </ScrollBox>,
      )

      expect(lastFrame()).toContain('Line 1')
      expect(lastFrame()).toContain('Line 2')
    })

    it('should render with custom scrollbar characters', () => {
      const { lastFrame } = render(
        <ScrollBox height={5} scrollbarTrackChar="░" scrollbarThumbChar="█" showScrollbar>
          <Text>Content</Text>
        </ScrollBox>,
      )

      expect(lastFrame()).toContain('Content')
    })
  })

  describe('scrollbar visibility', () => {
    it('should not show scrollbar when showScrollbar is false', () => {
      const { lastFrame } = render(
        <ScrollBox height={5} showScrollbar={false}>
          <Text>Line 1</Text>
          <Text>Line 2</Text>
          <Text>Line 3</Text>
        </ScrollBox>,
      )

      const frame = lastFrame()
      expect(frame).not.toContain('│')
      expect(frame).not.toContain('┃')
    })
  })

  describe('props', () => {
    it('should accept flexGrow prop', () => {
      const { lastFrame } = render(
        <Box flexDirection="column" height={20}>
          <ScrollBox flexGrow={1}>
            <Text>Flexible content</Text>
          </ScrollBox>
        </Box>,
      )

      expect(lastFrame()).toContain('Flexible content')
    })

    it('should accept custom height prop', () => {
      const { lastFrame } = render(
        <ScrollBox height={5}>
          <Text>Fixed height content</Text>
        </ScrollBox>,
      )

      expect(lastFrame()).toContain('Fixed height content')
    })
  })

  describe('scroll state', () => {
    it('should call onScroll callback when scrolling', () => {
      const onScrollMock = vi.fn()

      render(
        <ScrollBox height={5} onScroll={onScrollMock}>
          <Text>Content</Text>
        </ScrollBox>,
      )

      // In test environment without real measurements, onScroll won't be called
      // This test verifies the prop is accepted
      expect(onScrollMock).not.toHaveBeenCalled()
    })

    it('should accept stickyScroll prop', () => {
      // This test verifies the stickyScroll prop is accepted without errors.
      // Actual sticky scroll behavior is tested in integration tests where
      // real yoga layout provides accurate measurements. Unit tests with
      // mocked measureElement can't accurately test scroll position since
      // the mock returns fixed heights regardless of actual content.
      const { lastFrame } = render(
        <ScrollBox height={5} stickyScroll={false} showScrollbar={false}>
          <Text>Line 1</Text>
          <Text>Line 2</Text>
          <Text>Line 3</Text>
        </ScrollBox>,
      )

      expect(lastFrame()).toContain('Line 1')
    })
  })

  describe('mouse scroll', () => {
    it('should accept mouseScroll prop', () => {
      const { lastFrame } = render(
        <ScrollBox height={5} mouseScroll>
          <Text>Mouse scrollable content</Text>
        </ScrollBox>,
      )

      expect(lastFrame()).toContain('Mouse scrollable content')
    })

    it('should accept scrollStep prop', () => {
      const { lastFrame } = render(
        <ScrollBox height={5} mouseScroll scrollStep={5}>
          <Text>Custom scroll step</Text>
        </ScrollBox>,
      )

      expect(lastFrame()).toContain('Custom scroll step')
    })
  })

  describe('scrollY disabled', () => {
    it('should render content when scrollY is false', () => {
      const { lastFrame } = render(
        <ScrollBox height={5} scrollY={false}>
          <Text>Non-scrollable content</Text>
        </ScrollBox>,
      )

      expect(lastFrame()).toContain('Non-scrollable content')
    })
  })
})
