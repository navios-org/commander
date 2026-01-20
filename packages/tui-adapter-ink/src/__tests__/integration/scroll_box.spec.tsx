import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ScreenManagerInstance, ScreenLoggerInstance } from '@navios/commander-tui'
import type { Container } from '@navios/core'

import { ScreenManagerBridge } from '../../components/screen_manager_bridge.tsx'
import { STABLE_TIMESTAMP } from '../mocks/factories.ts'

import {
  createTestScreenManager,
  createTestLogger,
  testRender,
  TEST_DIMENSIONS,
} from './test_helpers.ts'

describe('ScrollBox Integration', () => {
  describe('message spacing', () => {
    let container: Container
    let manager: ScreenManagerInstance

    beforeEach(async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(STABLE_TIMESTAMP)

      const setup = await createTestScreenManager()
      container = setup.container
      manager = setup.manager
    })

    afterEach(async () => {
      vi.useRealTimers()
      await container.dispose()
    })

    it('should show consistent spacing between messages within viewport', async () => {
      const logger = await createTestLogger(container, 'Spacing')

      // Add just a few messages that fit within viewport
      logger.log('Message 1')
      logger.log('Message 2')
      logger.log('Message 3')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should show consistent spacing as messages are added incrementally', async () => {
      const logger = await createTestLogger(container, 'Incremental')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Add first message
      await act(() => logger.log('First message'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add second message - should have spacing after first
      await act(() => logger.log('Second message'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add third message - should have spacing after second
      await act(() => logger.log('Third message'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add fourth message - should have spacing after third
      await act(() => logger.log('Fourth message'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })
  })

  let container: Container
  let manager: ScreenManagerInstance

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(STABLE_TIMESTAMP)

    const setup = await createTestScreenManager()
    container = setup.container
    manager = setup.manager
  })

  afterEach(async () => {
    vi.useRealTimers()
    await container.dispose()
  })

  describe('sticky scroll behavior', () => {
    it('should render content that exceeds viewport height', async () => {
      const logger = await createTestLogger(container, 'Scroll')

      // Add many messages to exceed the viewport (24 rows - header = ~21 rows of content)
      for (let i = 1; i <= 30; i++) {
        logger.log(`Message ${i}`)
      }

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      // Wait for ScrollBox setTimeout measurements to complete
      await new Promise((resolve) => setTimeout(resolve, 100))
      await waitForFrame()
      await new Promise((resolve) => setTimeout(resolve, 100))
      await waitForFrame()

      const frame = lastFrame()

      // Verify the screen renders
      expect(frame).toContain('Scroll')
      // With sticky scroll, we should see the latest messages at the bottom
      // The exact messages visible depend on viewport size
      expect(frame).toMatchSnapshot()

      unmount()
    })

    it('should show new messages at bottom with sticky scroll as they are added', async () => {
      const logger = await createTestLogger(container, 'Live')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Add first batch of messages
      for (let i = 1; i <= 10; i++) {
        await act(() => logger.log(`Initial message ${i}`))
      }
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add more messages - with sticky scroll, view should follow
      for (let i = 11; i <= 20; i++) {
        await act(() => logger.log(`Additional message ${i}`))
      }
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add even more messages
      for (let i = 21; i <= 30; i++) {
        await act(() => logger.log(`Final message ${i}`))
      }
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should handle mixed content types with sticky scroll', async () => {
      const logger = await createTestLogger(container, 'Mixed')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Add various message types
      await act(() => logger.log('Starting process...'))
      await act(() => logger.log('Step 1 complete'))
      await act(() => logger.log('Step 2 complete'))
      await act(() => logger.log('Step 3 complete'))
      await act(() => logger.log('Step 4 complete'))
      await act(() => logger.log('Step 5 complete'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add loading message
      let loadingHandle!: ReturnType<typeof logger.loading>
      await act(() => {
        loadingHandle = logger.loading('Processing data...')
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Complete loading and add progress
      await act(() => loadingHandle.success('Data processed'))
      let progressHandle!: ReturnType<typeof logger.progress>
      await act(() => {
        progressHandle = logger.progress('Uploading files', { total: 100 })
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Update progress multiple times
      await act(() => progressHandle.update(25))
      await waitForFrame()
      await act(() => progressHandle.update(50))
      await waitForFrame()
      await act(() => progressHandle.update(75))
      await waitForFrame()
      await act(() => progressHandle.complete('Upload complete'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add final messages
      await act(() => logger.success('All tasks completed!'))
      await act(() => logger.log('Process finished at 12:00:00'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should handle rapid message additions', async () => {
      const logger = await createTestLogger(container, 'Rapid')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Rapidly add 50 messages
      await act(() => {
        for (let i = 1; i <= 50; i++) {
          logger.log(`Rapid message ${i}`)
        }
      })
      await waitForFrame()

      const frame = lastFrame()
      expect(frame).toContain('Rapid')
      // Should show some of the messages (the visible portion)
      expect(frame).toMatchSnapshot()

      unmount()
    })

    it('should maintain scroll position when content updates', async () => {
      const logger = await createTestLogger(container, 'Update')

      // Pre-populate with messages
      for (let i = 1; i <= 15; i++) {
        logger.log(`Pre-existing message ${i}`)
      }

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add more messages - sticky scroll should keep us at bottom
      await act(() => logger.log('New message 1'))
      await act(() => logger.log('New message 2'))
      await act(() => logger.log('New message 3'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })
  })

  describe('with small viewport', () => {
    it('should handle very small viewport gracefully', async () => {
      const logger = await createTestLogger(container, 'Small')

      // Add messages before rendering
      for (let i = 1; i <= 10; i++) {
        logger.log(`Message ${i}`)
      }

      // Render with smaller dimensions
      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        { columns: 60, rows: 10 },
      )

      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })
  })

  describe('with multiple screens', () => {
    it('should maintain independent scroll positions per screen', async () => {
      const logger1 = await createTestLogger(container, 'Screen1')
      const logger2 = await createTestLogger(container, 'Screen2')

      // Add many messages to both screens
      for (let i = 1; i <= 20; i++) {
        logger1.log(`Screen1 message ${i}`)
        logger2.log(`Screen2 message ${i}`)
      }

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      // Should show Screen1 content (first screen is active by default)
      expect(lastFrame()).toMatchSnapshot()

      // Switch to Screen2
      const screens = manager.getScreens()
      manager.setActiveScreen(screens[1]!)
      await waitForFrame()
      // Should now show Screen2 content
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })
  })
})
