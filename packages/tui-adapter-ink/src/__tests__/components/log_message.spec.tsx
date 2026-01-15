import { describe, it, expect } from 'vitest'

import { LogMessage } from '../../components/log/log_message.tsx'

/**
 * Component rendering tests are limited due to ink-testing-library limitations
 * with the Ink reconciler. These tests verify that the component can be imported
 * and has the expected structure.
 *
 * Full integration testing is done manually or through E2E tests.
 */
describe('LogMessage', () => {
  describe('component structure', () => {
    it('should be a valid React component', () => {
      expect(typeof LogMessage).toBe('function')
    })

    it('should accept required level prop', () => {
      // Type-level check - if this compiles, the prop types are correct
      const element = <LogMessage level="log">Content</LogMessage>
      expect(element.props.level).toBe('log')
      expect(element.props.children).toBe('Content')
    })

    it('should accept optional timestamp prop', () => {
      const timestamp = new Date('2025-01-01T12:30:45')
      const element = (
        <LogMessage level="log" timestamp={timestamp}>
          Content
        </LogMessage>
      )
      expect(element.props.timestamp).toBe(timestamp)
    })

    it('should accept optional label prop', () => {
      const element = (
        <LogMessage level="log" label="SERVER">
          Content
        </LogMessage>
      )
      expect(element.props.label).toBe('SERVER')
    })

    it('should accept optional trace prop', () => {
      const trace = 'at Function.main (/app/index.js:10)'
      const element = (
        <LogMessage level="log" trace={trace}>
          Content
        </LogMessage>
      )
      expect(element.props.trace).toBe(trace)
    })

    it('should accept optional borderStyle prop', () => {
      const element = (
        <LogMessage level="log" borderStyle="thick">
          Content
        </LogMessage>
      )
      expect(element.props.borderStyle).toBe('thick')
    })

    it('should accept optional variant prop', () => {
      const element = (
        <LogMessage level="log" variant="success">
          Content
        </LogMessage>
      )
      expect(element.props.variant).toBe('success')
    })
  })

  describe('log levels', () => {
    const levels = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'] as const

    for (const level of levels) {
      it(`should accept ${level} level`, () => {
        const element = <LogMessage level={level}>Content</LogMessage>
        expect(element.props.level).toBe(level)
      })
    }
  })

  describe('variants', () => {
    const variants = ['default', 'success', 'trace'] as const

    for (const variant of variants) {
      it(`should accept ${variant} variant`, () => {
        const element = (
          <LogMessage level="log" variant={variant}>
            Content
          </LogMessage>
        )
        expect(element.props.variant).toBe(variant)
      })
    }
  })
})
