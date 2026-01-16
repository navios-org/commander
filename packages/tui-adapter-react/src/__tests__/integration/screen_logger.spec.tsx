import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test'

import type { ScreenManagerInstance, ScreenLoggerInstance } from '@navios/commander-tui'
import type { Container } from '@navios/core'

import { ScreenManagerBridge } from '../../components/screen_manager_bridge.tsx'
import { STABLE_TIMESTAMP } from '../mocks/factories.ts'

import {
  createTestScreenManager,
  createTestLogger,
  testRender,
  TEST_DIMENSIONS,
  act,
} from './test_helpers.ts'

describe('ScreenLogger Integration', () => {
  let container: Container
  let manager: ScreenManagerInstance

  beforeEach(async () => {
    // Mock system time for consistent timestamps in snapshots
    setSystemTime(STABLE_TIMESTAMP)

    const setup = await createTestScreenManager()
    container = setup.container
    manager = setup.manager
  })

  afterEach(async () => {
    // Reset system time
    setSystemTime()
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

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render success message', async () => {
      logger.success('Operation completed successfully')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render messages with labels', async () => {
      logger.log('Starting build', 'BUILD')
      logger.warn('Deprecated API usage', 'DEPRECATION')
      logger.error('Connection failed', 'NETWORK')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should respect log level filtering', async () => {
      // Create logger with only error and fatal levels
      const errorLogger = await createTestLogger(container, 'ErrorOnly', ['error', 'fatal'])

      errorLogger.log('Should not appear')
      errorLogger.debug('Should not appear')
      errorLogger.warn('Should not appear')
      errorLogger.error('This error should appear')
      errorLogger.fatal('This fatal should appear')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })

  describe('loading handle', () => {
    let logger: ScreenLoggerInstance

    beforeEach(async () => {
      logger = await createTestLogger(container, 'Tasks')
    })

    it('should render loading state', async () => {
      logger.loading('Fetching data from server...')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render loading success state', async () => {
      const handle = logger.loading('Connecting to database...')
      handle.success('Connected!')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render loading fail state', async () => {
      const handle = logger.loading('Authenticating user...')
      handle.fail('Authentication failed')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })
  })

  describe('progress handle', () => {
    let logger: ScreenLoggerInstance

    beforeEach(async () => {
      logger = await createTestLogger(container, 'Progress')
    })

    it('should render progress bar', async () => {
      logger.progress('Downloading files', { total: 100 })

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render progress update', async () => {
      const handle = logger.progress('Installing packages', { total: 50 })
      handle.update(25)

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render progress with updated label', async () => {
      const handle = logger.progress('Processing', { total: 100 })
      handle.update(75, 'Almost done')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render completed progress', async () => {
      const handle = logger.progress('Build', { total: 100 })
      handle.complete('Build finished!')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render failed progress', async () => {
      const handle = logger.progress('Compilation', { total: 100 })
      handle.update(50)
      handle.fail('Compilation error')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
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

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
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

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      expect(frame).toMatchSnapshot()
    })

    it('should render table with title', async () => {
      logger.table(
        [
          { package: 'react', version: '19.0.0', size: '2.5kb' },
          { package: 'typescript', version: '5.0.0', size: '15kb' },
        ],
        { title: 'Dependencies' },
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

  describe('multiple loggers', () => {
    it('should render messages from multiple loggers to different screens', async () => {
      const buildLogger = await createTestLogger(container, 'Build')
      const testLogger = await createTestLogger(container, 'Tests')

      buildLogger.log('Compiling source files...')
      buildLogger.success('Build completed')

      testLogger.log('Running test suite...')
      testLogger.warn('1 test skipped')
      testLogger.success('42 tests passed')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      // Should show Build screen (first created) with its messages
      expect(frame).toMatchSnapshot()
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

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      await renderOnce()
      const frame = captureCharFrame()

      // Should show Tests screen content
      expect(frame).toMatchSnapshot()
    })
  })

  describe('progressive rendering', () => {
    it('should progressively render log messages as they are added', async () => {
      const logger = await createTestLogger(container, 'Build')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Initial empty state
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Add first message
      await act(() => logger.log('Starting build process...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Add second message
      await act(() => logger.log('Compiling TypeScript files...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Add warning
      await act(() => logger.warn('Deprecated API detected in src/legacy.ts'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Add success
      await act(() => logger.success('Build completed successfully!'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()
    })

    it('should progressively update loading state', async () => {
      const logger = await createTestLogger(container, 'Deploy')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Start loading
      let handle!: ReturnType<typeof logger.loading>
      await act(() => {
        handle = logger.loading('Deploying to production...')
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Complete with success
      await act(() => handle.success('Deployment complete!'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Add another loading that fails
      let failHandle!: ReturnType<typeof logger.loading>
      await act(() => {
        failHandle = logger.loading('Running post-deploy checks...')
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      await act(() => failHandle.fail('Health check failed'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()
    })

    it('should progressively update progress bar', async () => {
      const logger = await createTestLogger(container, 'Install')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Start progress at 0%
      let handle!: ReturnType<typeof logger.progress>
      await act(() => {
        handle = logger.progress('Installing dependencies', { total: 100 })
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Update to 25%
      await act(() => handle.update(25, 'Installing lodash...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Update to 50%
      await act(() => handle.update(50, 'Installing react...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Update to 75%
      await act(() => handle.update(75, 'Installing typescript...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Complete
      await act(() => handle.complete('All dependencies installed!'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()
    })

    it('should progressively build grouped messages', async () => {
      const logger = await createTestLogger(container, 'Pipeline')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Start first group
      await act(() => logger.group('Build Stage'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Add messages to group
      await act(() => logger.log('Compiling sources...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      await act(() => logger.success('Build passed'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // End first group
      await act(() => logger.groupEnd())
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Start second group
      await act(() => logger.group('Test Stage'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      await act(() => logger.log('Running unit tests...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      await act(() => logger.log('Running integration tests...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      await act(() => {
        logger.success('All tests passed')
        logger.groupEnd()
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()
    })

    it('should handle mixed message types progressively', async () => {
      const logger = await createTestLogger(container, 'CI')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Log message
      await act(() => logger.log('CI Pipeline started'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Start loading
      let loadingHandle!: ReturnType<typeof logger.loading>
      await act(() => {
        loadingHandle = logger.loading('Checking out code...')
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Complete loading, start progress
      let progressHandle!: ReturnType<typeof logger.progress>
      await act(() => {
        loadingHandle.success('Code checked out')
        progressHandle = logger.progress('Building project', { total: 100 })
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Update progress
      await act(() => progressHandle.update(50, 'Compiling...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Complete progress, add final log
      await act(() => {
        progressHandle.complete('Build successful')
        logger.success('Pipeline completed!')
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()
    })

    it('should handle loading failure progression', async () => {
      const logger = await createTestLogger(container, 'Network')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Start loading
      let handle!: ReturnType<typeof logger.loading>
      await act(() => {
        handle = logger.loading('Connecting to server...')
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Fail
      await act(() => handle.fail('Connection refused'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Add error details
      await act(() => logger.error('Failed to connect to api.example.com:443'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()
    })

    it('should handle progress failure progression', async () => {
      const logger = await createTestLogger(container, 'Upload')

      const { captureCharFrame, renderOnce } = await testRender(
        <ScreenManagerBridge manager={manager} />,
        TEST_DIMENSIONS,
      )

      // Start progress
      let handle!: ReturnType<typeof logger.progress>
      await act(() => {
        handle = logger.progress('Uploading files', { total: 100 })
      })
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Progress to 30%
      await act(() => handle.update(30, 'Uploading image1.png...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Progress to 60%
      await act(() => handle.update(60, 'Uploading image2.png...'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()

      // Fail at 60%
      await act(() => handle.fail('Upload failed: Network error'))
      await renderOnce()
      expect(captureCharFrame()).toMatchSnapshot()
    })
  })
})
