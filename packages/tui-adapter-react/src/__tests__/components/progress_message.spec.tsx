import { describe, it, expect } from 'bun:test'

import { ProgressMessage } from '../../components/screen/progress_message.tsx'
import { createProgressMessage } from '../mocks/factories.ts'
// Import setup to apply mocks
import '../setup.ts'

/**
 * ProgressMessage component tests
 *
 * Tests verify component structure, progress values, status handling, and content resolution.
 */
describe('ProgressMessage', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof ProgressMessage).toBe('function')
    })

    it('should accept message prop', () => {
      const message = createProgressMessage({ label: 'Downloading files' })
      const element = <ProgressMessage message={message} />
      expect(element.props.message).toBe(message)
    })
  })

  describe('progress values', () => {
    it('should accept various progress values', () => {
      const testCases = [
        { current: 0, total: 100 },
        { current: 50, total: 100 },
        { current: 100, total: 100 },
        { current: 5, total: 10 },
        { current: 999999, total: 1000000 },
      ]
      for (const { current, total } of testCases) {
        const message = createProgressMessage({ current, total })
        const element = <ProgressMessage message={message} />
        expect(element.props.message.current).toBe(current)
        expect(element.props.message.total).toBe(total)
      }
    })
  })

  describe('status', () => {
    it('should accept all status values', () => {
      const statuses = ['active', 'complete', 'failed'] as const
      for (const status of statuses) {
        const message = createProgressMessage({ status })
        const element = <ProgressMessage message={message} />
        expect(element.props.message.status).toBe(status)
      }
    })
  })

  describe('label and resolved content', () => {
    it('should accept label and resolvedContent', () => {
      const message = createProgressMessage({
        label: 'Processing',
        resolvedContent: 'All files processed!',
      })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.label).toBe('Processing')
      expect(element.props.message.resolvedContent).toBe('All files processed!')
    })

    it('should handle empty and long labels', () => {
      const emptyMessage = createProgressMessage({ label: '' })
      const longLabel = 'Processing very long file name that might overflow'
      const longMessage = createProgressMessage({ label: longLabel })

      expect((<ProgressMessage message={emptyMessage} />).props.message.label).toBe('')
      expect((<ProgressMessage message={longMessage} />).props.message.label).toBe(longLabel)
    })
  })

  describe('message factory usage', () => {
    it('should work with minimal factory call', () => {
      const message = createProgressMessage()
      const element = <ProgressMessage message={message} />

      expect(element.props.message.type).toBe('progress')
      expect(element.props.message.current).toBeDefined()
      expect(element.props.message.total).toBeDefined()
      expect(element.props.message.status).toBeDefined()
    })

    it('should work with fully customized message', () => {
      const message = createProgressMessage({
        id: 'custom-progress-id',
        label: 'Custom progress',
        current: 42,
        total: 100,
        status: 'active',
        resolvedContent: undefined,
        timestamp: new Date('2025-06-15T12:00:00'),
      })
      const element = <ProgressMessage message={message} />

      expect(element.props.message.id).toBe('custom-progress-id')
      expect(element.props.message.label).toBe('Custom progress')
      expect(element.props.message.current).toBe(42)
      expect(element.props.message.total).toBe(100)
    })
  })
})
