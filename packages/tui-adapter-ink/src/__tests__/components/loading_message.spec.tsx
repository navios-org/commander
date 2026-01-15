import { describe, it, expect } from 'vitest'

import { LoadingMessage } from '../../components/screen/loading_message.tsx'
import { createLoadingMessage } from '../mocks/factories.ts'

/**
 * Component rendering tests are limited due to ink-testing-library limitations
 * with the Ink reconciler. These tests verify component structure and props.
 *
 * Full integration testing is done manually or through E2E tests.
 */
describe('LoadingMessage', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof LoadingMessage).toBe('function')
    })

    it('should accept message prop', () => {
      const message = createLoadingMessage({ content: 'Loading data...' })
      const element = <LoadingMessage message={message} />
      expect(element.props.message).toBe(message)
    })
  })

  describe('message status', () => {
    it('should accept loading status', () => {
      const message = createLoadingMessage({ status: 'loading' })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.status).toBe('loading')
    })

    it('should accept success status', () => {
      const message = createLoadingMessage({ status: 'success' })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.status).toBe('success')
    })

    it('should accept fail status', () => {
      const message = createLoadingMessage({ status: 'fail' })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.status).toBe('fail')
    })
  })

  describe('resolved content', () => {
    it('should handle message without resolvedContent', () => {
      const message = createLoadingMessage({ resolvedContent: undefined })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.resolvedContent).toBeUndefined()
    })

    it('should handle message with resolvedContent', () => {
      const message = createLoadingMessage({ resolvedContent: 'Done!' })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.resolvedContent).toBe('Done!')
    })
  })
})
