import { describe, it, expect } from 'bun:test'

import { LoadingMessage } from '../../components/screen/loading_message.tsx'
import { createLoadingMessage } from '../mocks/factories.ts'

/**
 * LoadingMessage component tests for Solid.js adapter
 *
 * Due to Solid.js + OpenTUI requiring a renderer context for JSX execution,
 * these tests verify component existence and message factory functionality.
 * Full rendering tests would require a mock renderer context setup.
 */
describe('LoadingMessage', () => {
  it('should be a valid Solid component function', () => {
    expect(typeof LoadingMessage).toBe('function')
    expect(LoadingMessage.name).toBe('LoadingMessage')
  })

  describe('message factory', () => {
    it('should create loading message with default values', () => {
      const message = createLoadingMessage()
      expect(message.type).toBe('loading')
      expect(message.status).toBe('loading')
      expect(message.content).toBeDefined()
    })

    it('should create message with custom values', () => {
      const timestamp = new Date('2025-01-15T10:30:00')
      const message = createLoadingMessage({
        id: 'custom-id',
        content: 'Custom loading...',
        status: 'success',
        resolvedContent: 'Done!',
        timestamp,
      })
      expect(message.id).toBe('custom-id')
      expect(message.content).toBe('Custom loading...')
      expect(message.status).toBe('success')
      expect(message.resolvedContent).toBe('Done!')
      expect(message.timestamp).toBe(timestamp)
    })

    it('should accept all status values', () => {
      const statuses = ['loading', 'success', 'fail'] as const
      for (const status of statuses) {
        const message = createLoadingMessage({ status })
        expect(message.status).toBe(status)
      }
    })
  })
})
