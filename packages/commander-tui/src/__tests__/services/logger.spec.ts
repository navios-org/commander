import { TestContainer } from '@navios/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LogLevel } from '@navios/core'

import { ScreenLoggerInstance } from '../../services/logger.ts'
import { Screen } from '../../tokens/index.ts'
import { createMockScreenInstance } from '../utils/factories.ts'

import type { ScreenInstance } from '../../index.js'
import type { MockScreenInstance } from '../utils/factories.ts'

describe('ScreenLoggerInstance', () => {
  let container: TestContainer
  let mockScreen: MockScreenInstance

  const ALL_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']

  beforeEach(() => {
    container = new TestContainer()
    mockScreen = createMockScreenInstance()
    container.bind(Screen).toValue(mockScreen as unknown as ScreenInstance)
  })

  afterEach(async () => {
    await container.dispose()
  })

  async function createLogger(options: { enabledLevels?: LogLevel[] } = {}) {
    return container.get(ScreenLoggerInstance, {
      screen: 'test',
      enabledLevels: options.enabledLevels ?? ALL_LEVELS,
    })
  }

  describe('log level methods', () => {
    it('should add verbose message', async () => {
      const logger = await createLogger()

      logger.verbose('Verbose message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'verbose',
          content: 'Verbose message',
        }),
      )
    })

    it('should add debug message', async () => {
      const logger = await createLogger()

      logger.debug('Debug message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'debug',
          content: 'Debug message',
        }),
      )
    })

    it('should add log message', async () => {
      const logger = await createLogger()

      logger.log('Log message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'log',
          content: 'Log message',
        }),
      )
    })

    it('should add warn message', async () => {
      const logger = await createLogger()

      logger.warn('Warning message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'warn',
          content: 'Warning message',
        }),
      )
    })

    it('should add error message', async () => {
      const logger = await createLogger()

      logger.error('Error message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'error',
          content: 'Error message',
        }),
      )
    })

    it('should add fatal message', async () => {
      const logger = await createLogger()

      logger.fatal('Fatal message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'fatal',
          content: 'Fatal message',
        }),
      )
    })

    it('should add success message with success variant', async () => {
      const logger = await createLogger()

      logger.success('Success message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'log',
          content: 'Success message',
          variant: 'success',
        }),
      )
    })

    it('should add trace message with trace variant and stack trace', async () => {
      const logger = await createLogger()

      logger.trace('Trace message')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          level: 'verbose',
          content: 'Trace message',
          variant: 'trace',
          trace: expect.any(String),
        }),
      )
    })

    it('should include label when provided', async () => {
      const logger = await createLogger()

      logger.log('Message', 'CustomLabel')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'CustomLabel',
        }),
      )
    })

    it('should format objects to string', async () => {
      const logger = await createLogger()

      logger.log({ foo: 'bar', num: 42 })

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('foo'),
        }),
      )
    })

    it('should return this for chaining', async () => {
      const logger = await createLogger()

      const result = logger.log('Message').warn('Warning').error('Error')

      expect(result).toBe(logger)
      expect(mockScreen.addMessage).toHaveBeenCalledTimes(3)
    })

    it('should respect enabledLevels filter', async () => {
      const logger = await createLogger({ enabledLevels: ['error', 'fatal'] })

      logger.log('Should not appear')
      logger.warn('Should not appear')
      logger.error('Should appear')

      expect(mockScreen.addMessage).toHaveBeenCalledTimes(1)
      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' }),
      )
    })
  })

  describe('setLogLevels', () => {
    it('should update enabled levels', async () => {
      const logger = await createLogger({ enabledLevels: ['log'] })

      logger.error('Should not appear initially')
      expect(mockScreen.addMessage).toHaveBeenCalledTimes(0)

      logger.setLogLevels(['error'])
      logger.error('Should appear now')

      expect(mockScreen.addMessage).toHaveBeenCalledTimes(1)
    })

    it('should return this for chaining', async () => {
      const logger = await createLogger()

      const result = logger.setLogLevels(['error'])

      expect(result).toBe(logger)
    })
  })

  describe('file methods', () => {
    it('should add file message', async () => {
      const logger = await createLogger()

      logger.file('/path/to/file.ts', 'const x = 1;')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file',
          filePath: '/path/to/file.ts',
          content: 'const x = 1;',
        }),
      )
    })

    it('should add diff message', async () => {
      const logger = await createLogger()

      logger.diff('/path/to/file.ts', '- old\n+ new')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'diff',
          filePath: '/path/to/file.ts',
          diff: '- old\n+ new',
        }),
      )
    })

    it('should add diff message with view option', async () => {
      const logger = await createLogger()

      logger.diff('/path/to/file.ts', '- old\n+ new', 'split')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'diff',
          view: 'split',
        }),
      )
    })

    it('should add fileError message', async () => {
      const logger = await createLogger()

      logger.fileError('/path/to/file.ts', 'const x = 1;', [1, 3], 1)

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fileError',
          filePath: '/path/to/file.ts',
          content: 'const x = 1;',
          errorLines: [1, 3],
          startLine: 1,
        }),
      )
    })

    it('should respect debug level for file methods', async () => {
      const logger = await createLogger({ enabledLevels: ['log'] }) // No debug

      logger.file('/path.ts', 'content')

      expect(mockScreen.addMessage).not.toHaveBeenCalled()
    })

    it('should return this for chaining', async () => {
      const logger = await createLogger()

      const result = logger.file('/path.ts', 'content').diff('/path.ts', 'diff')

      expect(result).toBe(logger)
    })
  })

  describe('promise', () => {
    it('should add loading message initially', async () => {
      const logger = await createLogger()
      const testPromise = new Promise((resolve) => setTimeout(() => resolve('done'), 100))

      logger.promise(testPromise, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Failed!',
      })

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'loading',
          content: 'Loading...',
          status: 'loading',
        }),
      )
    })

    it('should update to success on resolve', async () => {
      const logger = await createLogger()
      const testPromise = Promise.resolve('result')

      await logger.promise(testPromise, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Failed!',
      })

      expect(mockScreen.updateMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'success',
          resolvedContent: 'Done!',
        }),
      )
    })

    it('should update to fail on reject', async () => {
      const logger = await createLogger()
      const testPromise = Promise.reject(new Error('Test error'))

      await expect(
        logger.promise(testPromise, {
          loading: 'Loading...',
          success: 'Done!',
          error: 'Failed!',
        }),
      ).rejects.toThrow('Test error')

      expect(mockScreen.updateMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'fail',
          resolvedContent: 'Failed!',
        }),
      )
    })

    it('should call success function with result', async () => {
      const logger = await createLogger()
      const testPromise = Promise.resolve({ count: 5 })
      const successFn = vi.fn((data: { count: number }) => `Processed ${data.count} items`)

      await logger.promise(testPromise, {
        loading: 'Loading...',
        success: successFn,
        error: 'Failed!',
      })

      expect(successFn).toHaveBeenCalledWith({ count: 5 })
      expect(mockScreen.updateMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          resolvedContent: 'Processed 5 items',
        }),
      )
    })

    it('should call error function with error', async () => {
      const logger = await createLogger()
      const testPromise = Promise.reject(new Error('Custom error'))
      const errorFn = vi.fn((err: Error) => `Error: ${err.message}`)

      await expect(
        logger.promise(testPromise, {
          loading: 'Loading...',
          success: 'Done!',
          error: errorFn,
        }),
      ).rejects.toThrow()

      expect(errorFn).toHaveBeenCalledWith(expect.any(Error))
      expect(mockScreen.updateMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          resolvedContent: 'Error: Custom error',
        }),
      )
    })
  })

  describe('loading', () => {
    it('should return handle with success and fail methods', async () => {
      const logger = await createLogger()

      const handle = logger.loading('Loading...')

      expect(handle).toHaveProperty('success')
      expect(handle).toHaveProperty('fail')
      expect(typeof handle.success).toBe('function')
      expect(typeof handle.fail).toBe('function')
    })

    it('should add loading message', async () => {
      const logger = await createLogger()

      logger.loading('Loading...')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'loading',
          content: 'Loading...',
          status: 'loading',
        }),
      )
    })

    it('should update to success when handle.success called', async () => {
      const logger = await createLogger()

      const handle = logger.loading('Loading...')
      handle.success('Completed!')

      expect(mockScreen.updateMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'success',
          resolvedContent: 'Completed!',
        }),
      )
    })

    it('should update to fail when handle.fail called', async () => {
      const logger = await createLogger()

      const handle = logger.loading('Loading...')
      handle.fail('Failed!')

      expect(mockScreen.updateMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'fail',
          resolvedContent: 'Failed!',
        }),
      )
    })
  })

  describe('progress', () => {
    it('should return handle with update, complete, and fail methods', async () => {
      const logger = await createLogger()

      const handle = logger.progress('Processing', { total: 100 })

      expect(handle).toHaveProperty('update')
      expect(handle).toHaveProperty('complete')
      expect(handle).toHaveProperty('fail')
    })

    it('should add progress message', async () => {
      const logger = await createLogger()

      logger.progress('Processing', { total: 100 })

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'progress',
          label: 'Processing',
          current: 0,
          total: 100,
          status: 'active',
        }),
      )
    })

    it('should update current value when handle.update called', async () => {
      const logger = await createLogger()

      const handle = logger.progress('Processing', { total: 100 })
      handle.update(50)

      expect(mockScreen.updateProgressMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          current: 50,
        }),
      )
    })

    it('should update label when handle.update called with label', async () => {
      const logger = await createLogger()

      const handle = logger.progress('Processing', { total: 100 })
      handle.update(50, 'New label')

      expect(mockScreen.updateProgressMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          current: 50,
          label: 'New label',
        }),
      )
    })

    it('should set status to complete when handle.complete called', async () => {
      const logger = await createLogger()

      const handle = logger.progress('Processing', { total: 100 })
      handle.complete('Done!')

      expect(mockScreen.updateProgressMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          current: 100,
          status: 'complete',
          resolvedContent: 'Done!',
        }),
      )
    })

    it('should set status to failed when handle.fail called', async () => {
      const logger = await createLogger()

      const handle = logger.progress('Processing', { total: 100 })
      handle.fail('Error occurred')

      expect(mockScreen.updateProgressMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'failed',
          resolvedContent: 'Error occurred',
        }),
      )
    })
  })

  describe('group methods', () => {
    it('should add group start marker', async () => {
      const logger = await createLogger()

      logger.group('My Group')

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'group',
          label: 'My Group',
          collapsed: false,
          isEnd: false,
        }),
      )
    })

    it('should add group end marker', async () => {
      const logger = await createLogger()

      logger.groupEnd()

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'group',
          isEnd: true,
        }),
      )
    })

    it('should return this for chaining', async () => {
      const logger = await createLogger()

      const result = logger.group('Group').log('Inside').groupEnd()

      expect(result).toBe(logger)
    })
  })

  describe('table', () => {
    it('should create table message from array of objects', async () => {
      const logger = await createLogger()

      logger.table([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ])

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'table',
          headers: ['name', 'age'],
          rows: [
            ['Alice', '30'],
            ['Bob', '25'],
          ],
        }),
      )
    })

    it('should include title when provided', async () => {
      const logger = await createLogger()

      logger.table([{ name: 'Alice' }], { title: 'Users' })

      expect(mockScreen.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Users',
        }),
      )
    })

    it('should return this for empty data', async () => {
      const logger = await createLogger()

      const result = logger.table([])

      expect(result).toBe(logger)
      expect(mockScreen.addMessage).not.toHaveBeenCalled()
    })

    it('should return this for chaining', async () => {
      const logger = await createLogger()

      const result = logger.table([{ a: 1 }])

      expect(result).toBe(logger)
    })
  })
})
