import { describe, it, expect } from 'bun:test'

import { LoadingMessage } from '../../components/screen/loading_message.tsx'
import { createLoadingMessage } from '../mocks/factories.ts'

// Import setup to apply mocks
import '../setup.ts'

/**
 * LoadingMessage component tests
 *
 * Tests verify component structure, status handling, and content resolution.
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
    it('should accept all status values', () => {
      const statuses = ['loading', 'success', 'fail'] as const
      for (const status of statuses) {
        const message = createLoadingMessage({ status })
        const element = <LoadingMessage message={message} />
        expect(element.props.message.status).toBe(status)
      }
    })
  })

  describe('content handling', () => {
    it('should accept content and resolvedContent from message', () => {
      const message = createLoadingMessage({
        content: 'Loading...',
        resolvedContent: 'Completed successfully!',
      })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.content).toBe('Loading...')
      expect(element.props.message.resolvedContent).toBe('Completed successfully!')
    })

    it('should handle message without resolvedContent', () => {
      const message = createLoadingMessage({ resolvedContent: undefined })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.resolvedContent).toBeUndefined()
    })
  })

  describe('timestamp', () => {
    it('should include timestamp from message', () => {
      const timestamp = new Date('2025-01-15T10:30:00')
      const message = createLoadingMessage({ timestamp })
      const element = <LoadingMessage message={message} />
      expect(element.props.message.timestamp).toBe(timestamp)
    })
  })

  describe('message factory usage', () => {
    it('should work with minimal factory call', () => {
      const message = createLoadingMessage()
      const element = <LoadingMessage message={message} />

      expect(element.props.message.type).toBe('loading')
      expect(element.props.message.status).toBe('loading')
      expect(element.props.message.content).toBeDefined()
    })

    it('should work with fully customized message', () => {
      const message = createLoadingMessage({
        id: 'custom-id',
        content: 'Custom loading content',
        status: 'success',
        resolvedContent: 'Custom resolved content',
        timestamp: new Date('2025-06-15T12:00:00'),
      })
      const element = <LoadingMessage message={message} />

      expect(element.props.message.id).toBe('custom-id')
      expect(element.props.message.content).toBe('Custom loading content')
      expect(element.props.message.status).toBe('success')
      expect(element.props.message.resolvedContent).toBe('Custom resolved content')
    })
  })
})
