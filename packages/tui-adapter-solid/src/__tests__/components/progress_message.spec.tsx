import { describe, it, expect } from 'bun:test'

import { ProgressMessage } from '../../components/screen/progress_message.tsx'
import { createProgressMessage } from '../mocks/factories.ts'

/**
 * ProgressMessage component tests for Solid.js adapter
 *
 * Due to Solid.js + OpenTUI requiring a renderer context for JSX execution,
 * these tests verify component existence and message factory functionality.
 * Full rendering tests would require a mock renderer context setup.
 */
describe('ProgressMessage', () => {
  it('should be a valid Solid component function', () => {
    expect(typeof ProgressMessage).toBe('function')
    expect(ProgressMessage.name).toBe('ProgressMessage')
  })

  describe('message factory', () => {
    it('should create progress message with default values', () => {
      const message = createProgressMessage()
      expect(message.type).toBe('progress')
      expect(message.current).toBeDefined()
      expect(message.total).toBeDefined()
      expect(message.status).toBeDefined()
    })

    it('should create message with custom progress values', () => {
      const testCases = [
        { current: 0, total: 100 },
        { current: 50, total: 100 },
        { current: 100, total: 100 },
      ]
      for (const { current, total } of testCases) {
        const message = createProgressMessage({ current, total })
        expect(message.current).toBe(current)
        expect(message.total).toBe(total)
      }
    })

    it('should accept all status values', () => {
      const statuses = ['active', 'complete', 'failed'] as const
      for (const status of statuses) {
        const message = createProgressMessage({ status })
        expect(message.status).toBe(status)
      }
    })

    it('should create message with label and resolvedContent', () => {
      const message = createProgressMessage({
        label: 'Uploading files',
        resolvedContent: 'Done!',
      })
      expect(message.label).toBe('Uploading files')
      expect(message.resolvedContent).toBe('Done!')
    })
  })
})
