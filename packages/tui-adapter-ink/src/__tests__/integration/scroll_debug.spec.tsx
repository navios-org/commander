import { Box, Text } from 'ink'
import { describe, expect, it } from 'vitest'

import { ScrollBox } from '../../components/scroll/scroll_box.tsx'

import { testRender, TEST_DIMENSIONS } from './test_helpers.ts'

// A simple message component that mimics LogMessage structure
function SimpleMessage({ children }: { children: React.ReactNode }) {
  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Text>│</Text>
        <Text> </Text>
        <Text>{children}</Text>
      </Box>
    </Box>
  )
}

describe('ScrollBox standalone', () => {
  it('should show scrollbar when simple Text content exceeds viewport', async () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`)

    // Each child is passed directly to ScrollBox for per-item measurement
    const { lastFrame, unmount, waitForFrame } = await testRender(
      <ScrollBox flexGrow={1} stickyScroll showScrollbar>
        {lines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </ScrollBox>,
      TEST_DIMENSIONS,
    )

    await waitForFrame()
    // Wait for measurement effects
    await new Promise((resolve) => setTimeout(resolve, 100))
    await waitForFrame()

    const frame = lastFrame()

    // With sticky scroll, should show last lines and scrollbar
    expect(frame).toContain('Line 49')
    expect(frame).toContain('Line 50')
    expect(frame).toContain('┃') // Scrollbar thumb
    expect(frame).toMatchSnapshot()

    unmount()
  })

  it('should show scrollbar when nested component content exceeds viewport', async () => {
    const lines = Array.from({ length: 30 }, (_, i) => `Message ${i + 1}`)

    // Each message is a direct child for per-item measurement
    const { lastFrame, unmount, waitForFrame } = await testRender(
      <ScrollBox flexGrow={1} stickyScroll showScrollbar>
        {lines.map((line, i) => (
          <Box key={i} marginBottom={1} paddingLeft={1}>
            <SimpleMessage>{line}</SimpleMessage>
          </Box>
        ))}
      </ScrollBox>,
      TEST_DIMENSIONS,
    )

    await waitForFrame()
    // Wait for measurement effects
    await new Promise((resolve) => setTimeout(resolve, 100))
    await waitForFrame()

    const frame = lastFrame()

    // With sticky scroll, should show last messages and scrollbar
    expect(frame).toContain('Message 30')
    expect(frame).toContain('┃') // Scrollbar thumb

    unmount()
  })
})
