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

describe('ScreenLogger Integration', () => {
  let container: Container
  let manager: ScreenManagerInstance

  beforeEach(async () => {
    // Mock system time for consistent timestamps in snapshots
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

  describe('log methods', () => {
    let logger: ScreenLoggerInstance

    beforeEach(async () => {
      logger = await createTestLogger(container, 'App')
    })

    it('should render log messages from logger', async () => {
      logger.log('Application started')
      logger.debug('Debug info')
      logger.warn('Warning message')
      logger.error('Error occurred')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render success message', async () => {
      logger.success('Operation completed successfully')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render messages with labels', async () => {
      logger.log('Starting build', 'BUILD')
      logger.warn('Deprecated API usage', 'DEPRECATION')
      logger.error('Connection failed', 'NETWORK')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should respect log level filtering', async () => {
      // Create logger with only error and fatal levels
      const errorLogger = await createTestLogger(container, 'ErrorOnly', ['error', 'fatal'])

      errorLogger.log('Should not appear')
      errorLogger.debug('Should not appear')
      errorLogger.warn('Should not appear')
      errorLogger.error('This error should appear')
      errorLogger.fatal('This fatal should appear')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })
  })

  describe('loading handle', () => {
    let logger: ScreenLoggerInstance

    beforeEach(async () => {
      logger = await createTestLogger(container, 'Tasks')
    })

    it('should render loading state', async () => {
      logger.loading('Fetching data from server...')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render loading success state', async () => {
      const handle = logger.loading('Connecting to database...')
      handle.success('Connected!')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render loading fail state', async () => {
      const handle = logger.loading('Authenticating user...')
      handle.fail('Authentication failed')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })
  })

  describe('progress handle', () => {
    let logger: ScreenLoggerInstance

    beforeEach(async () => {
      logger = await createTestLogger(container, 'Progress')
    })

    it('should render progress bar', async () => {
      logger.progress('Downloading files', { total: 100 })

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render progress update', async () => {
      const handle = logger.progress('Installing packages', { total: 50 })
      handle.update(25)

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render progress with updated label', async () => {
      const handle = logger.progress('Processing', { total: 100 })
      handle.update(75, 'Almost done')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render completed progress', async () => {
      const handle = logger.progress('Build', { total: 100 })
      handle.complete('Build finished!')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render failed progress', async () => {
      const handle = logger.progress('Compilation', { total: 100 })
      handle.update(50)
      handle.fail('Compilation error')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })
  })

  describe('groups', () => {
    let logger: ScreenLoggerInstance

    beforeEach(async () => {
      logger = await createTestLogger(container, 'Grouped')
    })

    it('should render message groups', async () => {
      logger.group('Build Phase')
      logger.log('Compiling TypeScript')
      logger.log('Bundling assets')
      logger.groupEnd()

      logger.group('Test Phase')
      logger.log('Running unit tests')
      logger.log('Running integration tests')
      logger.groupEnd()

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })
  })

  describe('table', () => {
    let logger: ScreenLoggerInstance

    beforeEach(async () => {
      logger = await createTestLogger(container, 'Tables')
    })

    it('should render table data', async () => {
      logger.table([
        { name: 'Alice', role: 'Developer', status: 'Active' },
        { name: 'Bob', role: 'Designer', status: 'Active' },
        { name: 'Charlie', role: 'Manager', status: 'Away' },
      ])

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should render table with title', async () => {
      logger.table(
        [
          { package: 'react', version: '19.0.0', size: '2.5kb' },
          { package: 'typescript', version: '5.0.0', size: '15kb' },
        ],
        { title: 'Dependencies' },
      )

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      expect(frame).toMatchSnapshot()
      unmount()
    })
  })

  describe('multiple loggers', () => {
    it('should render messages from multiple loggers to different screens', async () => {
      const buildLogger = await createTestLogger(container, 'Build')
      const testLogger = await createTestLogger(container, 'Tests')

      buildLogger.log('Compiling source files...')
      buildLogger.success('Build completed')

      testLogger.log('Running test suite...')
      testLogger.warn('1 test skipped')
      testLogger.success('42 tests passed')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      // Should show Build screen (first created) with its messages
      expect(frame).toMatchSnapshot()
      unmount()
    })

    it('should switch between screens with different logger outputs', async () => {
      const buildLogger = await createTestLogger(container, 'Build')
      const testLogger = await createTestLogger(container, 'Tests')

      buildLogger.log('Build output here')
      testLogger.log('Test output here')

      // Get screens and switch to Tests screen
      const screens = manager.getScreens()
      const testsScreen = screens.find((s) => s.getName() === 'Tests')
      if (testsScreen) {
        manager.setActiveScreen(testsScreen)
      }

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()
      const frame = lastFrame()

      // Should show Tests screen content
      expect(frame).toMatchSnapshot()
      unmount()
    })
  })

  describe('dynamic screen creation', () => {
    it('should create screen dynamically after render and display content', async () => {
      // First render the manager with no screens
      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Initial state - no screens
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Now dynamically create a logger (which creates a screen)
      const logger = await createTestLogger(container, 'DynamicApp')

      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Use the logger to add messages
      await act(() => logger.log('First dynamic message'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      await act(() => logger.success('Dynamic screen is working!'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should create multiple screens dynamically after render', async () => {
      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Initial state - no screens
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Create first logger/screen dynamically
      const buildLogger = await createTestLogger(container, 'Build')
      await act(() => buildLogger.log('Build started'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Create second logger/screen dynamically
      const testLogger = await createTestLogger(container, 'Tests')
      await act(() => testLogger.log('Tests started'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Create third logger/screen dynamically
      const deployLogger = await createTestLogger(container, 'Deploy')
      await act(() => deployLogger.log('Deployment initiated'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Verify all screens are tracked
      const screens = manager.getScreens()
      expect(screens).toHaveLength(3)
      expect(screens.map((s) => s.getName())).toEqual(['Build', 'Tests', 'Deploy'])

      unmount()
    })

    it('should switch between dynamically created screens', async () => {
      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()

      // Create screens dynamically
      const frontendLogger = await createTestLogger(container, 'Frontend')
      const backendLogger = await createTestLogger(container, 'Backend')

      await act(() => frontendLogger.log('Frontend: Building React app...'))
      await act(() => backendLogger.log('Backend: Starting Node server...'))
      await waitForFrame()

      // First screen (Frontend) should be active
      expect(lastFrame()).toMatchSnapshot()

      // Switch to Backend screen
      const screens = manager.getScreens()
      const backendScreen = screens.find((s) => s.getName() === 'Backend')
      expect(backendScreen).toBeDefined()

      await act(() => manager.setActiveScreen(backendScreen!))
      await waitForFrame()

      // Backend screen should now be visible
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should handle loading and progress on dynamically created screen', async () => {
      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()

      // Create logger dynamically
      const installLogger = await createTestLogger(container, 'Install')

      // Start with a loading indicator
      let loadingHandle!: ReturnType<typeof installLogger.loading>
      await act(() => {
        loadingHandle = installLogger.loading('Resolving dependencies...')
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Complete loading, start progress
      await act(() => loadingHandle.success('Dependencies resolved'))

      let progressHandle!: ReturnType<typeof installLogger.progress>
      await act(() => {
        progressHandle = installLogger.progress('Installing packages', { total: 100 })
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Update progress
      await act(() => progressHandle.update(50, 'Installing react...'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Complete
      await act(() => progressHandle.complete('All packages installed!'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should update dynamically created screen with groups', async () => {
      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await waitForFrame()

      // Create logger dynamically
      const ciLogger = await createTestLogger(container, 'CI Pipeline')

      // Add grouped messages
      await act(() => {
        ciLogger.group('Setup')
        ciLogger.log('Cloning repository')
        ciLogger.log('Installing dependencies')
        ciLogger.groupEnd()
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      await act(() => {
        ciLogger.group('Build')
        ciLogger.log('Compiling TypeScript')
        ciLogger.log('Bundling assets')
        ciLogger.success('Build complete')
        ciLogger.groupEnd()
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })
  })

  describe('progressive rendering', () => {
    it('should progressively render log messages as they are added', async () => {
      const logger = await createTestLogger(container, 'Build')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Initial empty state
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add first message
      await act(() => logger.log('Starting build process...'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add second message
      await act(() => logger.log('Compiling TypeScript files...'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add warning
      await act(() => logger.warn('Deprecated API detected in src/legacy.ts'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add success
      await act(() => logger.success('Build completed successfully!'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should progressively update loading state', async () => {
      const logger = await createTestLogger(container, 'Deploy')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Start loading
      let handle!: ReturnType<typeof logger.loading>
      await act(() => {
        handle = logger.loading('Deploying to production...')
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Complete with success
      await act(() => handle.success('Deployment complete!'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Add another loading that fails
      let failHandle!: ReturnType<typeof logger.loading>
      await act(() => {
        failHandle = logger.loading('Running post-deploy checks...')
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      await act(() => failHandle.fail('Health check failed'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should progressively update progress bar', async () => {
      const logger = await createTestLogger(container, 'Install')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Start progress at 0%
      let handle!: ReturnType<typeof logger.progress>
      await act(() => {
        handle = logger.progress('Installing dependencies', { total: 100 })
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Update to 25%
      await act(() => handle.update(25, 'Installing lodash...'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Update to 50%
      await act(() => handle.update(50, 'Installing react...'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Update to 75%
      await act(() => handle.update(75, 'Installing typescript...'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Complete
      await act(() => handle.complete('All dependencies installed!'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })

    it('should handle mixed message types progressively', async () => {
      const logger = await createTestLogger(container, 'CI')

      const { lastFrame, unmount, waitForFrame } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Log message
      await act(() => logger.log('CI Pipeline started'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Start loading
      let loadingHandle!: ReturnType<typeof logger.loading>
      await act(() => {
        loadingHandle = logger.loading('Checking out code...')
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Complete loading, start progress
      await act(() => loadingHandle.success('Code checked out'))
      let progressHandle!: ReturnType<typeof logger.progress>
      await act(() => {
        progressHandle = logger.progress('Building project', { total: 100 })
      })
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Update progress
      await act(() => progressHandle.update(50, 'Compiling...'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      // Complete progress, add final log
      await act(() => progressHandle.complete('Build successful'))
      await act(() => logger.success('Pipeline completed!'))
      await waitForFrame()
      expect(lastFrame()).toMatchSnapshot()

      unmount()
    })
  })
})
