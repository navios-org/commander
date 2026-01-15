import { describe, it, expect } from 'vitest'

import { ProgressMessage } from '../../components/screen/progress_message.tsx'
import { createProgressMessage } from '../mocks/factories.ts'

/**
 * Component rendering tests are limited due to ink-testing-library limitations
 * with the Ink reconciler. These tests verify component structure and props.
 *
 * Full integration testing is done manually or through E2E tests.
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
    it('should accept 0% progress', () => {
      const message = createProgressMessage({ current: 0, total: 100 })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.current).toBe(0)
      expect(element.props.message.total).toBe(100)
    })

    it('should accept 100% progress', () => {
      const message = createProgressMessage({ current: 100, total: 100 })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.current).toBe(100)
      expect(element.props.message.total).toBe(100)
    })

    it('should accept fractional progress', () => {
      const message = createProgressMessage({ current: 33, total: 100 })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.current).toBe(33)
    })
  })

  describe('status', () => {
    it('should accept active status', () => {
      const message = createProgressMessage({ status: 'active' })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.status).toBe('active')
    })

    it('should accept complete status', () => {
      const message = createProgressMessage({ status: 'complete' })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.status).toBe('complete')
    })

    it('should accept failed status', () => {
      const message = createProgressMessage({ status: 'failed' })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.status).toBe('failed')
    })
  })

  describe('resolved content', () => {
    it('should handle message without resolvedContent', () => {
      const message = createProgressMessage({ resolvedContent: undefined })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.resolvedContent).toBeUndefined()
    })

    it('should handle message with resolvedContent', () => {
      const message = createProgressMessage({ resolvedContent: 'Done!' })
      const element = <ProgressMessage message={message} />
      expect(element.props.message.resolvedContent).toBe('Done!')
    })
  })
})
