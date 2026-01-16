import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

import type { ScreenManagerInstance, ScreenInstance } from '@navios/commander-tui'
import type { Container } from '@navios/core'

import { ScreenManagerBridge } from '../../components/screen_manager_bridge.tsx'
import {
  createLogMessage,
  createLoadingMessage,
  createProgressMessage,
  resetIdCounter,
  STABLE_TIMESTAMP,
} from '../mocks/factories.ts'

import { createTestScreenManager, testRender, TEST_DIMENSIONS } from './test_helpers.ts'

describe('ScreenManager Integration', () => {
  let container: Container
  let manager: ScreenManagerInstance

  beforeEach(async () => {
    resetIdCounter()
    const setup = await createTestScreenManager()
    container = setup.container
    manager = setup.manager
  })

  afterEach(async () => {
    await container.dispose()
  })

  describe('with single screen', () => {
    let screen: ScreenInstance

    beforeEach(() => {
      screen = manager.createScreen({ name: 'Main', static: true })
    })

    it('should render empty screen', async () => {
      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render screen with log message', async () => {
      screen.addMessage(
        createLogMessage({
          content: 'Hello World',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render screen with multiple log messages', async () => {
      screen.addMessage(
        createLogMessage({
          content: 'First message',
          level: 'log',
          timestamp: STABLE_TIMESTAMP,
        }),
      )
      screen.addMessage(
        createLogMessage({
          content: 'Warning message',
          level: 'warn',
          timestamp: STABLE_TIMESTAMP,
        }),
      )
      screen.addMessage(
        createLogMessage({
          content: 'Error message',
          level: 'error',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render screen with loading message', async () => {
      screen.addMessage(
        createLoadingMessage({
          content: 'Loading data...',
          status: 'loading',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render screen with progress message', async () => {
      screen.addMessage(
        createProgressMessage({
          label: 'Processing files',
          current: 45,
          total: 100,
          status: 'active',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render screen with mixed message types', async () => {
      screen.addMessage(
        createLogMessage({
          content: 'Starting process...',
          level: 'log',
          timestamp: STABLE_TIMESTAMP,
        }),
      )
      screen.addMessage(
        createLoadingMessage({
          content: 'Fetching data',
          status: 'loading',
          timestamp: STABLE_TIMESTAMP,
        }),
      )
      screen.addMessage(
        createProgressMessage({
          label: 'Downloading',
          current: 30,
          total: 100,
          status: 'active',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })

  describe('with multiple screens', () => {
    let screen1: ScreenInstance
    let screen2: ScreenInstance

    beforeEach(() => {
      screen1 = manager.createScreen({ name: 'Build', static: true })
      screen2 = manager.createScreen({ name: 'Tests', static: true })
    })

    it('should render sidebar with multiple screens', async () => {
      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should show first screen as active by default', async () => {
      screen1.addMessage(
        createLogMessage({
          content: 'Build output',
          timestamp: STABLE_TIMESTAMP,
        }),
      )
      screen2.addMessage(
        createLogMessage({
          content: 'Test output',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      // Should show Build screen content (first screen)
      expect(frame).toMatchSnapshot()
    })

    it('should render second screen when set as active', async () => {
      screen1.addMessage(
        createLogMessage({
          content: 'Build output',
          timestamp: STABLE_TIMESTAMP,
        }),
      )
      screen2.addMessage(
        createLogMessage({
          content: 'Test output',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      // Set second screen as active
      manager.setActiveScreen(screen2)

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      // Should show Tests screen content
      expect(frame).toMatchSnapshot()
    })

    it('should highlight selected screen in sidebar', async () => {
      // Navigate to second screen in sidebar
      manager.navigateDown()

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should handle screen with icon and badge', async () => {
      const screen3 = manager.createScreen({
        name: 'Errors',
        icon: '⚠️',
        badgeCount: 3,
        static: true,
      })
      screen3.addMessage(
        createLogMessage({
          content: 'Error 1',
          level: 'error',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })

  describe('render tracking', () => {
    it('should capture non-empty frame', async () => {
      // Single screen does not trigger the useScreenList hook re-render issue
      const screen = manager.createScreen({ name: 'Main', static: true })
      screen.addMessage(
        createLogMessage({
          content: 'Test message',
          timestamp: STABLE_TIMESTAMP,
        }),
      )

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      // Verify we got a valid frame with content
      expect(frame.length).toBeGreaterThan(0)
      expect(frame).toMatchSnapshot()
    })
  })
})
